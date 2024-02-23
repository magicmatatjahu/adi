import { createCustomResolver } from "@adi/core";
import { createDefinition, getDecoratorContext } from "@adi/core/lib/utils";

import { ADI_ENHANCERS_DEF } from './constants';
import { patchEnhancerMethod } from './apply';
import { GUARDS, INTERCEPTORS, PIPES, EXCEPTION_HANDLERS } from "./tokens";

import type { ClassType, CustomResolver, InjectionItem, InjectionMetadata, ProviderToken } from "@adi/core";
import type { EnhancerType, EnhancerMethod, EnhancersDefinition, EnhancersMethodList, PipeExtractor, PipeExtractorType, PipeExtractorOptions } from "./types";

export const enhancersDefinitions = createDefinition<EnhancersDefinition>(ADI_ENHANCERS_DEF, enhancersFactory);

export function applyEnhancers(target: Object, key: string | symbol | undefined, descriptor: TypedPropertyDescriptor<any> | undefined, kind: 'interceptors' | 'guards' | 'pipes' | 'exceptionHandlers' | 'empty', enhancers: EnhancerType[] = []): void {
  const ctx = getDecoratorContext(target, key, descriptor);
  const definition = enhancersDefinitions.ensure(ctx.class);
  const decoratorKind = ctx.kind;

  const methodName = key as string | symbol;
  if (kind === 'empty') {
    if (decoratorKind === 'method') {
      patchEnhancerMethod(target as ClassType, methodName);
      ensureEnhancersMethod(definition, methodName);
    }
    return;
  }

  const resolvers = enhancers.map(enhancer => createResolver(enhancer, kind))
  switch (decoratorKind) {
    case 'method': {
      patchEnhancerMethod(target as ClassType, methodName);
      const method = ensureEnhancersMethod(definition, methodName);
      method[kind].push(...resolvers)
      return
    }
    case 'class': {
      definition.class[kind].push(...resolvers)
      return
    }
  }
}

export function applyPipeExtractor(target: Object, key: string | symbol, index: number, enhancers: EnhancerType[] = [], extractor?: PipeExtractorType, data?: unknown, options?: PipeExtractorOptions) {
  const ctx = getDecoratorContext(target, key, index);
  const definition = enhancersDefinitions.ensure(ctx.class);

  patchEnhancerMethod(target as ClassType, key);
  const method = ensureEnhancersMethod(definition, key);
  let extractorMetadata = method.extractors[index];
  if (!extractorMetadata) {
    extractorMetadata = method.extractors[index] = {
      extractor: defaultPipeExtractor,
      pipes: []
    }
  }

  const resolvers = enhancers.map(enhancer => createResolver(enhancer, 'pipes'))
  extractorMetadata.pipes.push(...resolvers)
  if (extractor) {
    extractorMetadata.extractor = createResolver(extractor, 'extractor') as CustomResolver
  }
}

const defaultPipeExtractor: CustomResolver<PipeExtractor> = () => ({
  extract(argument, ctx) {
    if (ctx.kind === 'adi:function-call') {
      return ctx.data[argument.index];
    }
  },
})

export const globalEnhancerResolvers = {
  guards: createCustomResolver({ kind: 'injection-item', item: GUARDS }),
  interceptors: createCustomResolver({ kind: 'injection-item', item: INTERCEPTORS }),
  pipes: createCustomResolver({ kind: 'injection-item', item: PIPES }),
  exceptionHandlers: createCustomResolver({ kind: 'injection-item', item: EXCEPTION_HANDLERS }),
}

function ensureEnhancersMethod(definition: EnhancersDefinition, methodName: string | symbol) {
  const methods = definition.methods;
  if (methods[methodName]) {
    return methods[methodName];
  }
  return methods[methodName] = enhancersMethodListFactory();
}

function enhancersFactory(): EnhancersDefinition {
  return {
    class: {
      guards: [],
      interceptors: [],
      pipes: [],
      exceptionHandlers: [],
    },
    methods: {},
  };
}

function enhancersMethodListFactory(): EnhancersMethodList {
  return {
    guards: [],
    interceptors: [],
    pipes: [],
    extractors: [],
    exceptionHandlers: [],
  };
}

const enhancersMethod: Record<string, EnhancerMethod | 'extract'> = {
  'guards': 'canPerform',
  'interceptors': 'intercept',
  'pipes': 'transform',
  'extractor': 'extract',
  'exceptionHandlers': 'catch',
}

function hasInjections(enhancer: unknown): enhancer is { inject: Array<InjectionItem> } {
  return Array.isArray((enhancer as { inject: Array<InjectionItem> }).inject);
}

function createResolver(enhancer: EnhancerType | PipeExtractorType, kind: 'guards' | 'interceptors' | 'pipes' | 'extractor' | 'exceptionHandlers', metadata: Partial<InjectionMetadata>) {
  const methodName = enhancersMethod[kind];
  if (typeof enhancer === 'object' && typeof enhancer[methodName] === 'function') {
    if (hasInjections(enhancer)) {
      return createCustomResolver({ kind: 'function', handler: enhancer[methodName], inject: enhancer.inject, metadata });
    }
    return createCustomResolver({ kind: 'value', value: enhancer })
  }
  return createCustomResolver({ kind: 'injection-item', item: enhancer as ProviderToken, metadata });
}
