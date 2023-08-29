import { createInjectionArgument, overrideInjections } from './metadata';
import { InjectionKind } from '../enums';
import { ADI_INJECTABLE_DEF } from '../private';
import { createArray, createDefinition, getAllKeys, isExtended, Reflection } from '../utils';

import type { ClassType, AbstractClassType, InjectableDefinition, InjectableOptions, Injections, InjectionArguments, InjectionArgument, InjectionItem } from "../types";

export const injectableDefinitions = createDefinition<InjectableDefinition>(ADI_INJECTABLE_DEF, injectableFactory);

export function injectableMixin(token: InjectableDefinition['token'], injections?: Injections | Array<InjectionItem>, options?: InjectableOptions): InjectableDefinition {
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

    if (isExtended(token)) {
      inheritance(token, definition, reflectedTypes);
    }
    
    if (injections) {
      definition.injections = overrideInjections(definition.injections, injections, token);
    }
  }

  return definition;
}

export function InjectableMixin<TBase extends ClassType>(input: { injections?: Injections | Array<InjectionItem>, options?: InjectableOptions }, Base?: TBase): ClassType {
  const clazz = Base ? class InjectableMixin extends Base {} : class InjectableMixin {};
  injectableMixin(clazz, input.injections, input.options);
  return clazz;
}

function injectableFactory(): InjectableDefinition {
  return {
    token: undefined as any,
    init: false,
    options: {},
    injections: {
      parameters: [],
      properties: {},
      methods: {},
      static: undefined,
    },
  };
}

function inheritance(target: ClassType | AbstractClassType, definition: InjectableDefinition, reflectedTypes: Array<ClassType | AbstractClassType>): InjectableDefinition {
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

function mergeParameters(target: Function, injectionParameters: InjectionArguments['parameters'], reflectedParameters: Array<ClassType | AbstractClassType>): void {
  reflectedParameters.forEach((reflectedParameter, index) => {
    injectionParameters[index] = injectionParameters[index] || createInjectionArgument(reflectedParameter, { kind: InjectionKind.PARAMETER, target, index, annotations: {} });
  });
}

function inheritanceParemeters(target: ClassType | AbstractClassType, defParameters: InjectionArguments['parameters'], parameters: InjectionArguments['parameters'], reflectedTypes: Array<ClassType | AbstractClassType>) {
  // if class has defined parameters, then skip overriding parameters from parent class
  if (defParameters.length > 0) {
    return mergeParameters(target, defParameters, reflectedTypes);
  }

  // definition parameters is an empty array - merging parent ctor arguments
  parameters.forEach((parameter, index) => {
    if (parameter) {
      defParameters[index] = createInjectionArgument(parameter.token,  { ...parameter.metadata, target }, parameter.hooks);
    }
  });
}

function inheritanceProperties(target: ClassType | AbstractClassType, defProperties: InjectionArguments['properties'], properties: InjectionArguments['properties']) {
  getAllKeys(properties).forEach(key => {
    const inheritedProp = properties[key];
    defProperties[key] = defProperties[key] || createInjectionArgument(inheritedProp.token, { ...inheritedProp.metadata, target }, inheritedProp.hooks);
  });
}

function inheritanceMethods(target: ClassType | AbstractClassType, toLook: Object, defMethods: InjectionArguments['methods'], methods: InjectionArguments['methods']) {
  const targetMethods = [...Object.getOwnPropertyNames(toLook), ...Object.getOwnPropertySymbols(toLook)];
  getAllKeys(methods).forEach(key => {
    // check if target has method.
    // if yes, user could make it injectable from scratch or override to pure (without injection) function in extended class.
    // if not, copy injections from parent class
    if (!targetMethods.includes(key)) {
      const copiedMethod: InjectionArgument<any>[] = defMethods[key] = [];
      methods[key].forEach((methodArg, index) => {
        if (methodArg) {
          copiedMethod[index] = createInjectionArgument(methodArg.token, { ...methodArg.metadata, target, descriptor: Object.getOwnPropertyDescriptor(toLook, key) }, methodArg.hooks);
        }
      });
    }
  });
}
