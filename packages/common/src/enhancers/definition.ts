import { convertInjection, createFunctionResolver, inject } from '@adi/core/lib/injector';
import { createDefinition } from '@adi/core/lib/utils/definition';
import { getDecoratorInfo } from '@adi/core/lib/utils/get-decorator-info';
import { ADI_ENHANCERS_DEF } from '../constants';
import { hasInjections } from '../utils';

import type { InjectionItem, InjectionMetadata } from '@adi/core';
import type { EnhancerType, EnhancerKind, EnhancerMethod, EnhancersDefinition, EnhancerItem, EnhancersDefinitionMethod, ExtractorFactory, PipeTransform, StandalonePipeTransform, ArgumentMetadata } from './interfaces';

export const enhancersDefinitions = createDefinition<EnhancersDefinition>(ADI_ENHANCERS_DEF, enhancersFactory);

export function enhancersMixin(enhancers: EnhancerType[], kind: EnhancerKind, target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any> | number): EnhancersDefinition {
  const definition = enhancersDefinitions.ensure(target);
  const decoratorInfo = getDecoratorInfo(target, key, descriptor);

  if (
    decoratorInfo.kind !== 'method' && 
    (kind === 'pipe' && decoratorInfo.kind !== 'parameter')
  ) {
    return;
  }

  const kindPlural = `${kind}s`;
  const methodName = (decoratorInfo as { key: string | symbol }).key;
  const index = (decoratorInfo as { index: number }).index;
  const metadata: InjectionMetadata = {
    kind: `enhancer-${kind}` as any,
    target,
    annotations: {}, // TODO: add annotations or remove it
    static: (decoratorInfo as { static: boolean }).static || false,
    index,
    key: methodName,
    descriptor: (decoratorInfo as { descriptor: PropertyDescriptor }).descriptor,
  };

  const method = definition[methodName] || (definition[methodName] = enhancersMethodFactory(target, key));
  if (kind === 'pipe') {
    const pipes = method['pipes'][index].enhancers;
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

  return definition;
}

export function pipeMixin(factory: ExtractorFactory, data: unknown, enhancers: Array<InjectionItem | PipeTransform | StandalonePipeTransform> = [], target: Object, methodName: string | symbol, index: number): EnhancersDefinition {
  const definition = enhancersDefinitions.ensure(target);
  const decoratorInfo = getDecoratorInfo(target, methodName, index);
  if (decoratorInfo.kind !== 'parameter') {
    return;
  }

  const metadata: ArgumentMetadata = {
    index,
    data,
    reflectedType: '',
  };

  const method = definition[methodName] || (definition[methodName] = enhancersMethodFactory(target, methodName));
  method['pipes'][index] = { enhancers: [], metadata, extractor: factory || defaultExtractor };
  return enhancersMixin(enhancers, 'pipe', target, methodName, index);
}

function enhancersFactory(): EnhancersDefinition {
  return {};
}

function enhancersMethodFactory(target: Object, key: string | symbol): EnhancersDefinitionMethod {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  return {
    ctxMetadata: {
      target,
      key,
      descriptor,
      static: false,
      reflectedTypes: []
    },
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

function convertEnhancers(enhancer: EnhancerType, kind: EnhancerKind, injectionMetadata: InjectionMetadata): EnhancerItem {
  const methodName = enhancersMethod[kind];
  let resolver: EnhancerItem['resolver'];
  if (typeof enhancer === 'object' && typeof enhancer[methodName] === 'function') {
    if (hasInjections(enhancer)) {
      // TODO: How to pass injection and execution context in this case? 
      resolver = createFunctionResolver(enhancer[methodName], enhancer.inject);
    } else {
      resolver = () => enhancer;
    }
  } else {
    const injectionItem = convertInjection(enhancer as InjectionItem, { ...injectionMetadata });
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
