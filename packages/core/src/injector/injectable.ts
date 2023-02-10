import { createInjectionArgument, overrideInjections } from './metadata';
import { InjectionKind } from '../enums';
import { ADI_INJECTABLE_DEF } from '../private';
import { createArray, createDefinition, getAllKeys, Reflection } from '../utils';

import type { ClassType, AbstractClassType, InjectableDefinition, Injections, InjectionArguments, InjectionItem } from "../interfaces";

export const injectableDefinitions = createDefinition<InjectableDefinition>(ADI_INJECTABLE_DEF, injectableFactory);

export function injectableMixin(token: InjectableDefinition['token'], options?: InjectableDefinition['options'], injections?: Injections | Array<InjectionItem>): InjectableDefinition {
  const definition = injectableDefinitions.ensure(token);
  if (definition.init) {
    return definition;
  }
  definition.init = true;

  definition.token = token;
  if (options) {
    options = definition.options = Object.assign(definition.options, options);
    if (options.hooks) {
      options.hooks = createArray(options.hooks);
    }
  }

  if (typeof token === 'function') {
    const reflectedTypes = Reflection.getOwnMetadata("design:paramtypes", token) || [];
    mergeParameters(token, definition.injections.parameters, reflectedTypes);

    inheritance(token, definition, reflectedTypes);
    if (injections) {
      definition.injections = overrideInjections(definition.injections, injections, token);
    }

    // if (inherited && inherited.init) {
    //   const options = definition.options;
    //   const inheritedOptions = inherited.options;
    //   options.scope = options.scope || inheritedOptions.scope;
    //   options.hooks = options.hooks || inheritedOptions.hooks;
    //   options.annotations = options.annotations || inheritedOptions.annotations;
    // }
  }

  return definition;
}

function injectableFactory(): InjectableDefinition {
  return {
    token: undefined,
    init: false,
    options: {},
    injections: {
      parameters: [],
      properties: {},
      methods: {},
    },
  };
}

function inheritance(target: ClassType | AbstractClassType, definition: InjectableDefinition, reflectedTypes: Array<ClassType | AbstractClassType>): InjectableDefinition {
  // when class is not extended, skip klogic
  if (target.prototype.__proto__ === Object.prototype) {
    return;
  }

  const injections = definition.injections;
  const inherited = injectableMixin(Object.getPrototypeOf(target));
  const inheritedInjections = inherited.injections;
  inheritanceParemeters(target, injections.parameters, inheritedInjections.parameters, reflectedTypes);
  inheritanceProperties(target, injections.properties, inheritedInjections.properties);
  inheritanceMethods(target, target.prototype, injections.methods, inheritedInjections.methods);
  if (inheritedInjections.static) {
    injections.static = injections.static || { properties: {}, methods: {} };
    inheritanceProperties(target, injections.static.properties, inheritedInjections.static.properties);
    inheritanceMethods(target, target, injections.static.methods, inheritedInjections.static.methods);
  }

  return inherited;
}

function mergeParameters(target: Function, injectionParameters: InjectionArguments['parameters'], parameters: Array<ClassType | AbstractClassType>): void {
  parameters.forEach((parameter, index) => {
    injectionParameters[index] = injectionParameters[index] || createInjectionArgument(parameter, undefined, { kind: InjectionKind.PARAMETER, target, index, key: undefined, descriptor: undefined, annotations: {} });
  });
}

function inheritanceParemeters(target: ClassType | AbstractClassType, defParameters: InjectionArguments['parameters'], parameters: InjectionArguments['parameters'], reflectedTypes: Array<ClassType | AbstractClassType>) {
  // if class has defined parameters, then skip overriding parameters from parent class
  if (defParameters.length > 0) {
    return mergeParameters(target, defParameters, reflectedTypes);
  }

  // definition parameters is an empty array - merging parent ctor arguments
  parameters.forEach((parameter, index) => {
    defParameters[index] = createInjectionArgument(parameter.token, parameter.hooks, { ...parameter.metadata, target });
  });
}

function inheritanceProperties(target: ClassType | AbstractClassType, defProperties: InjectionArguments['properties'], properties: InjectionArguments['properties']) {
  getAllKeys(properties).forEach(key => {
    const inheritedProp = properties[key];
    defProperties[key] = defProperties[key] || createInjectionArgument(inheritedProp.token, inheritedProp.hooks, { ...inheritedProp.metadata, target });
  });
}

function inheritanceMethods(target: ClassType | AbstractClassType, toLook: Object, defMethods: InjectionArguments['methods'], methods: InjectionArguments['methods']) {
  const targetMethods = [...Object.getOwnPropertyNames(toLook), ...Object.getOwnPropertySymbols(toLook)];
  getAllKeys(methods).forEach(key => {
    // check if target has method.
    // if yes, user could make it injectable from scratch or override to pure (without injection) function in extended class.
    // if not, copy injections from parent class
    if (!targetMethods.includes(key)) {
      const copiedMethod = defMethods[key] = [];
      methods[key].forEach((methodArg, index) => {
        copiedMethod[index] = createInjectionArgument(methodArg.token, methodArg.hooks, { ...methodArg.metadata, target, descriptor: Object.getOwnPropertyDescriptor(toLook, key) });
      });
    }
  });
}
