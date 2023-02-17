import { injectableDefinitions, createInjectionArgument } from '@adi/core/lib/injector';
import { InjectionKind } from '@adi/core/lib/enums';
import { getDecoratorInfo, createDefinition, Reflection } from '@adi/core/lib/utils';

import type { ClassType, AbstractClassType, InjectionArguments, InjectionArgument } from '@adi/core';
import type { ProvidesOptions, ProvideDefinition } from '../interfaces';

export const ADI_PROVIDE_DEF = 'adi:definition:provide';

export const providesDefinitions = createDefinition<ProvideDefinition>(ADI_PROVIDE_DEF, provideFactory);

export function providesMixin(token: ClassType | AbstractClassType, method: { methodName: string | symbol, static?: boolean } | string | symbol, options: ProvidesOptions = {}): ProvideDefinition {
  let methodName: string | symbol, isStatic: boolean;
  if (typeof method !== 'object') {
    methodName = method;
    isStatic = true;
  } else {
    methodName = method.methodName;
    isStatic = method.static;
  }

  // TODO: Optimize it
  const target = isStatic ? token : token.constructor;
  const reflectedTypes = Reflection.getOwnMetadata("design:paramtypes", token, methodName) || [];
  const injectableDefinition = injectableDefinitions.ensure(target);
  const methods = getProperInjections(isStatic, injectableDefinition.injections).methods;
  methods[methodName] = mergeParameters(token, methods[methodName], methodName, reflectedTypes, isStatic);
  
  options.provide = options.provide || Reflection.getOwnMetadata("design:returntype", token, methodName);
  const definition = providesDefinitions.ensure(target);
  const provides = isStatic ? definition.static : definition.prototype;
  provides[methodName] ? Object.assign(provides[methodName], options) : (provides[methodName] = options);
  return definition;
}

function provideFactory(): ProvideDefinition {
  return {
    prototype: {}, 
    static: {},
  };
}

// TODO: Optimize it
function mergeParameters(target: Function, injectionParameters: Array<InjectionArgument> = [], methodName: string | symbol, parameters: Array<ClassType | AbstractClassType>, isStatic: boolean) {
  const descriptor = Object.getOwnPropertyDescriptor(target, methodName);
  parameters.forEach((parameter, index) => {
    injectionParameters[index] = injectionParameters[index] || createInjectionArgument(parameter, undefined, { kind: InjectionKind.PARAMETER, target: isStatic ? target : target.prototype, index, key: methodName, descriptor, function: undefined, static: isStatic, annotations: {} });
  });
  return injectionParameters;
}

function getProperInjections(isStatic: boolean, injections: InjectionArguments): InjectionArguments {
  return isStatic ? (injections.static || (injections.static = { properties: {}, methods: {} })) as InjectionArguments : injections;
}

export function Provides(options?: ProvidesOptions): MethodDecorator {
  return function(target: Function, key: string | symbol, descriptor: PropertyDescriptor) {
    const decoratorInfo = getDecoratorInfo(target, key, descriptor);
    if (decoratorInfo.kind !== 'method') {
      throw new Error('@Provides decorator can be only used on method level.');
    }
    providesMixin(target, { methodName: decoratorInfo.key, static: decoratorInfo.static }, options);
  }
}
