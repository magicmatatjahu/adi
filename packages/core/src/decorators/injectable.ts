import { ADI_INJECTABLE_DEF } from "../constants";
import { InjectionKind } from '../enums';
import { createInjectionArgument } from '../injector/metadata';
import { Reflection } from "../utils";

import type { ClassType, InjectableDefinition, InjectableOptions, InjectionArgument, PlainInjections } from "../interfaces";

export function Injectable(options?: InjectableOptions): ClassDecorator {
  return function(target: Function) {
    applyInjectableDefinition(target, options);
  }
}

export function injectableMixin(target: Function, options: InjectableOptions, injections?: PlainInjections): void {
  applyInjectableDefinition(target, options);
}

export function getInjectableDefinition<T>(injectable: unknown): InjectableDefinition<T> | undefined {
  if (injectable && injectable.hasOwnProperty(ADI_INJECTABLE_DEF)) {
    return injectable[ADI_INJECTABLE_DEF];
  }
  return;
}

export function ensureInjectableDefinition<T>(injectable: T): InjectableDefinition<T> {
  if (!injectable.hasOwnProperty(ADI_INJECTABLE_DEF)) {
    Object.defineProperty(injectable, ADI_INJECTABLE_DEF, { value: defineInjectableDefinition(injectable), enumerable: true });
  }
  return injectable[ADI_INJECTABLE_DEF];
}

function applyInjectableDefinition<T>(target: Function, options?: InjectableOptions): InjectableDefinition<T> | undefined {
  if (typeof target !== 'function') return;

  const paramtypes = Reflection.getOwnMetadata("design:paramtypes", target) || [];
  const def = ensureInjectableDefinition(target);
  def.options = Object.assign(def.options, options);

  // check inheritance
  inheritance(target, def, paramtypes);
}

function defineInjectableDefinition<T>(token: T): InjectableDefinition<T> {
  return {
    token,
    options: {},
    injections: {
      parameters: [],
      properties: {},
      methods: {},
    },
    meta: {},
  };
}

function inheritance(target: Function, def: InjectableDefinition, parameters: Array<ClassType>): void {
  // when class is not extended, then only merge constructor params
  if (target.prototype.__proto__ === Object.prototype) {
    mergeParameters(target, def.injections.parameters, parameters);
    return;
  }

  const inheritedClass = Object.getPrototypeOf(target);
  let inheritedDef = getInjectableDefinition(inheritedClass);
  if (inheritedDef === undefined
    // checks whether the injectable definition has been fully initialized - by saving injectable's configuration
    // inheritedDef.factory === undefine // TODO: FIX IT
  ) {
    inheritedDef = getInjectableDefinition(injectableMixin(inheritedClass, {}));
  }

  const injections = def.injections;
  const inheritedInjections = inheritedDef.injections;
  
  // override/adjust constructor injection
  // if class has defined parameters, then skip overriding parameters from parent class
  const defParameters = injections.parameters;
  if (parameters.length > 0) {
    mergeParameters(target, defParameters, parameters);
  } else {
    // definedArgs is empty array in case of merging parent ctor arguments
    const inheritedParameters = inheritedInjections.parameters;
    for (let i = 0, l = inheritedParameters.length; i < l; i++) {
      const param = inheritedParameters[i]
      defParameters[i] = createInjectionArgument(param.token, param.hooks, { ...param.metadata, target });
    }
  }

  // override/adjust properties injection
  const defProps = injections.properties;
  const inheritedProps = inheritedInjections.properties;
  const props = Object.keys(inheritedProps);
  props.push(...Object.getOwnPropertySymbols(inheritedProps) as any[]);
  for (let key in props) {
    const inheritedProp = inheritedProps[key];
    defProps[key] = defProps[key] || createInjectionArgument(inheritedProp.token, inheritedProp.hooks, { ...inheritedProp.metadata, target });
  }

  // override/adjust methods injection
  const targetMethods = Object.getOwnPropertyNames((target as any).prototype);
  for (let key in inheritedInjections.methods) {
    // check if target has method.
    // if yes, user could make it injectable from scratch or override to pure (without injection) function in extended class.
    // if not, copy injections from parent class
    if (targetMethods.includes(key) === false) {
      const copiedMethod: InjectionArgument[] = [];
      const method = inheritedInjections.methods[key];
      for (let i = 0, l = method.length; i < l; i++) {
        const arg = method[i];
        const handler = Object.getOwnPropertyDescriptor(target.prototype, key);
        copiedMethod[i] = createInjectionArgument(arg.token, arg.hooks, { ...arg.metadata, target, handler: handler.value });
      }
      injections.methods[key] = copiedMethod;
    }
  }
}

function mergeParameters(target: Object, defParameters: Array<InjectionArgument>, parameters: Array<ClassType>): void {
  for (let index = 0, l = parameters.length; index < l; index++) {
    defParameters[index] = defParameters[index] || createInjectionArgument(parameters[index], undefined, { kind: InjectionKind.PARAMETER, target, index });
  }
}
