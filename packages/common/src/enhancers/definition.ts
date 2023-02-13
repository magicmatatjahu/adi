import { All, Optional, wait } from '@adi/core';
import { InjectionKind } from '@adi/core/lib/enums';
import { convertInjection, convertInjections, inject, injectArray } from '@adi/core/lib/injector';
import { createDefinition, getAllKeys, getDecoratorInfo, Reflection } from '@adi/core/lib/utils';
import { ADI_ENHANCERS_DEF } from '../constants';
import { hasInjections } from '../utils';

import type { Session, InjectionItem, InjectionMetadata, ProviderToken } from '@adi/core';
import type { EnhancerType, EnhancerKind, EnhancerMethod, EnhancersDefinition, EnhancerItem, EnhancersDefinitionMethod, ExtractorFactory, PipeTransform, StandalonePipeTransform, ArgumentMetadata } from './interfaces';

export const enhancersDefinitions = createDefinition<EnhancersDefinition>(ADI_ENHANCERS_DEF, enhancersFactory);

export function enhancersMixin(enhancers: EnhancerType[], enhancerKind: EnhancerKind, target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any> | number): EnhancersDefinition {
  const definition = enhancersDefinitions.ensure(target);
  const decoratorInfo = getDecoratorInfo(target, key, descriptor);

  const decoratorKind = decoratorInfo.kind;
  const index = (decoratorInfo as { index: number }).index;
  const metadata: InjectionMetadata = {
    kind: InjectionKind.CUSTOM,
    target,
    key,
    index,
    static: (decoratorInfo as { static: boolean }).static || false,
    descriptor: (decoratorInfo as { descriptor: PropertyDescriptor }).descriptor,
    annotations: {
      enhancerKind,
      enhancerPlace: decoratorKind,
    },
  };

  const methods = definition.methods;
  if (decoratorKind === 'method') {
    const method = methods[key] || (methods[key] = enhancersMethodFactory(target, key, metadata));
    extendEnhancerMethod(enhancers, method, enhancerKind, { ...metadata, key, index });
  } else if (decoratorKind === 'class') {
    getAllKeys(methods).forEach(methodName => {
      const method = methods[methodName];
      // TODO: Add class enhancers at the beginning of collection
      extendEnhancerMethod(enhancers, method, enhancerKind, { ...method.metadata });
    });
  }

  return definition;
}

const hooks = [Optional(), All()];
export function addEnhancersByToken(token: ProviderToken, methods: Record<string | symbol, EnhancersDefinitionMethod>, kind: EnhancerKind) {
  getAllKeys(methods).forEach(methodName => {
    const method = methods[methodName];
    extendEnhancerMethod([{ token, hooks, annotations: {} }], method, kind, { ...method.metadata });
  });
}

function extendEnhancerMethod(enhancers: EnhancerType[], method: EnhancersDefinitionMethod, kind: EnhancerKind, metadata: InjectionMetadata) {
  const kindPlural = `${kind}s`;
  if (kind === 'pipe') {
    const pipes = method[kindPlural][metadata.index].enhancers;
    enhancers.forEach(enhancer => {
      const converted = convertEnhancers(enhancer, kind, metadata);
      pipes.push(converted);
    });
  } else {
    enhancers.forEach(enhancer => {
      const converted = convertEnhancers(enhancer, kind, metadata);
      method[kindPlural].push(converted);
    });
  }
}

export function pipeMixin(factory: ExtractorFactory, data: unknown, enhancers: Array<InjectionItem | PipeTransform | StandalonePipeTransform> = [], target: Object, methodName: string | symbol, index: number, injMetadata?: InjectionMetadata): EnhancersDefinition {
  const definition = enhancersDefinitions.ensure(target);
  const decoratorInfo = getDecoratorInfo(target, methodName, index);
  if (decoratorInfo.kind !== 'parameter') {
    return;
  }

  const reflectedType = Reflection.getOwnMetadata("design:paramtypes", target, methodName)[index];
  const metadata: ArgumentMetadata = {
    index,
    data,
    reflectedType,
  };

  const method = definition.methods[methodName] || (definition.methods[methodName] = enhancersMethodFactory(target, methodName, injMetadata));
  method['pipes'][index] = { enhancers: [], metadata, extractor: factory || defaultExtractor };
  return enhancersMixin(enhancers, 'pipe', target, methodName, index);
}

function enhancersFactory(): EnhancersDefinition {
  return {
    methods: {},
  };
}

function enhancersMethodFactory(target: Object, key: string | symbol, metadata?: InjectionMetadata): EnhancersDefinitionMethod {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  const reflectedTypes = Reflection.getOwnMetadata("design:paramtypes", target, key);

  return {
    ctxMetadata: {
      target,
      key,
      descriptor,
      static: false,
      reflectedTypes,
    },
    metadata: metadata || {} as any,
    interceptors: [],
    guards: [],
    exceptionHandlers: [],
    pipes: [],
  };
}

const enhancersMethod: Record<EnhancerKind, EnhancerMethod> = {
  'interceptor': 'intercept',
  'guard': 'canPerform',
  'exceptionHandler': 'catch',
  'pipe': 'transform',
}

function convertEnhancers(enhancer: EnhancerType, kind: EnhancerKind, metadata: InjectionMetadata): EnhancerItem {
  const methodName = enhancersMethod[kind];
  let resolver: EnhancerItem['resolver'];
  if (typeof enhancer === 'object' && typeof enhancer[methodName] === 'function') {
    if (hasInjections(enhancer)) {
      // TODO: How to pass injection and execution context in this case? 
      resolver = functionResolver(enhancer[methodName], methodName, enhancer.inject, metadata);
    } else {
      resolver = () => enhancer;
    }
  } else {
    const injectionItem = convertInjection(enhancer as InjectionItem, metadata);
    resolver = (session) => inject(session.context.injector, injectionItem, session);
  }

  return {
    resolver,
  }
}

const defaultExtractor: ExtractorFactory = (metadata, ctx) => {
  if (ctx.type === 'adi:function-call') {
    return ctx.data[metadata.index];
  }
};

function functionResolver<T>(factory: (...args: any[]) => T | Promise<T>, methodName: EnhancerMethod, injections: Array<InjectionItem> = [], metadata: InjectionMetadata) {
  const converted = convertInjections(injections, { ...metadata, function: factory });
  return (session: Session) => {
    const injector = session.context.injector;
    return wait(
      injectArray(injector, converted, session),
      deps => ({ [methodName]: (...args: any[]) => factory(...args, ...deps) }),
    );
  }
}

// const globalResolvers: Record<EnhancerKind, EnhancerItem> = {
//   interceptor: { resolver: (session) => inject(session.context.injector, { token:  }, session) },
// }

// export function applyGlobalResolvers(clazz: ClassType, definition: EnhancersDefinition) {

// }
