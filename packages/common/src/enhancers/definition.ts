import { All, Optional, wait } from '@adi/core';
import { InjectionKind } from '@adi/core/lib/enums';
import { convertInjection, convertInjections, inject, injectArray } from '@adi/core/lib/injector';
import { createDefinition, getAllKeys, getDecoratorInfo, Reflection } from '@adi/core/lib/utils';
import { ADI_ENHANCERS_DEF } from '../constants';
import { hasInjections } from '../utils';

import type { Session, InjectionItem, InjectionMetadata, ProviderToken, ClassType } from '@adi/core';
import type { Decorator } from '@adi/core/lib/utils';
import type { EnhancerType, EnhancerKind, EnhancerMethod, EnhancersDefinition, EnhancerItem, EnhancersDefinitionMethod, EnhancersDefinitionPipe, ExtractorFactory, ArgumentMetadata, PipeTransformType } from './interfaces';

export const enhancersDefinitions = createDefinition<EnhancersDefinition>(ADI_ENHANCERS_DEF, enhancersFactory);

export function applyEnhancers(enhancers: EnhancerType[], enhancerKind: EnhancerKind, target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>): EnhancersDefinition {
  const decoratorInfo = getDecoratorInfo(target, key, descriptor);
  const definition = enhancersDefinitions.ensure(decoratorInfo.class);
  const decoratorKind = decoratorInfo.kind;

  if (decoratorKind === 'method') {
    const method = ensureEnhancersMethod(definition, key, decoratorInfo);
    extendEnhancers(enhancers, enhancerKind, method, 'method');
    return definition;
  }

  const methods = definition.methods;
  getAllKeys(methods).forEach(methodName => {
    const method = methods[methodName];
    extendEnhancers(enhancers, enhancerKind, method, 'class');
  });

  return definition;
}

const hooks = [Optional(), All()];
export function addEnhancersByToken(tokens: ProviderToken[], kind: EnhancerKind, definition: EnhancersDefinition) {
  const methods = definition.methods;
  const serialized = tokens.map(token => ({ token, hooks }));

  if (kind === 'pipe') {
    getAllKeys(methods).forEach(methodName => {
      const method = methods[methodName];
      extendPipes(serialized, method, 'global');
    });
    return;
  }

  getAllKeys(methods).forEach(methodName => {
    const method = methods[methodName];
    extendEnhancers(serialized, kind, method, 'global');
  });
}

function extendEnhancers(enhancers: EnhancerType[], enhancerKind: EnhancerKind, method: EnhancersDefinitionMethod, enhancerLocation: 'class' | 'method' | 'global') {
  const metadata = method.injMetadata;
  const newMetadata = { ...metadata, annotations: { ...metadata.annotations, enhancerKind, enhancerLocation } }

  const converted: EnhancerItem[] = [];
  enhancers.forEach(enhancer => {
    converted.push(convertEnhancers(enhancer, enhancerKind, { ...newMetadata }));
  });

  const pluralKind = enhancersPlural[enhancerKind];
  method[pluralKind] = [...converted, ...method[pluralKind]];
}

export function applyPipes(enhancers: PipeTransformType[], target: Object, key?: string | symbol, descriptorOrIndex?: TypedPropertyDescriptor<any> | number, factory?: ExtractorFactory, data?: unknown) {
  const decoratorInfo = getDecoratorInfo(target, key, descriptorOrIndex);
  const definition = enhancersDefinitions.ensure(decoratorInfo.class);
  const decoratorKind = decoratorInfo.kind;

  if (decoratorKind === 'parameter') {
    const index = descriptorOrIndex as number;
    const enhancerKind = 'pipe';

    const method = ensureEnhancersMethod(definition, key, decoratorInfo);
    const pipe = ensurePipe(method, decoratorInfo, key, index);
    if (factory) {
      (pipe as { extractor: ExtractorFactory }).extractor = factory;
    }
    pipe.metadata.data = data || pipe.metadata.data;
    
    const metadata = method.injMetadata;
    const newMetadata = { ...metadata, annotations: { ...metadata.annotations, enhancerKind, enhancerLocation: 'parameter' } };
    const converted: EnhancerItem[] = [];
    enhancers.forEach(enhancer => {
      converted.push(convertEnhancers(enhancer, enhancerKind, { ...newMetadata, index }));
    });
    (pipe as { enhancers: EnhancerItem[] }).enhancers = [...converted, ...pipe.enhancers];
  } else if (decoratorKind === 'method') {
    const method = ensureEnhancersMethod(definition, key, decoratorInfo);
    extendPipes(enhancers, method, 'method');
  } else {
    const methods = definition.methods;
    getAllKeys(methods).forEach(methodName => {
      const method = methods[methodName];
      extendPipes(enhancers, method, 'class');
    });
  }

  return definition;
}

function extendPipes(enhancers: PipeTransformType[], method: EnhancersDefinitionMethod, enhancerLocation: 'class' | 'method' | 'parameter' | 'global') {
  const metadata = method.injMetadata;
  const enhancerKind = 'pipe'
  const newMetadata = { ...metadata, annotations: { ...metadata.annotations, enhancerKind, enhancerLocation } };

  method.pipes.forEach((pipe, index) => {
    if (!pipe) {
      return;
    }

    const converted: EnhancerItem[] = [];
    enhancers.forEach(enhancer => {
      converted.push(convertEnhancers(enhancer, enhancerKind, { ...newMetadata, index }));
    });
    (pipe as { enhancers: EnhancerItem[] }).enhancers = [...converted, ...pipe.enhancers];
  });
}

function enhancersFactory(): EnhancersDefinition {
  return {
    methods: {},
  };
}

function ensureEnhancersMethod(definition: EnhancersDefinition, methodName: string | symbol, info: Decorator) {
  let method = definition.methods[methodName];
  if (method) {
    return method;
  }

  const injMetadata: InjectionMetadata = {
    ...info,
    kind: InjectionKind.CUSTOM,
    annotations: {
      enhancerPlace: info.kind,
    },
  };
  return definition.methods[methodName] = enhancersMethodFactory(info.class, methodName, injMetadata);
}

function enhancersMethodFactory(target: ClassType, key: string | symbol, injMetadata: InjectionMetadata): EnhancersDefinitionMethod {
  const targetObject = target.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(targetObject, key);
  const reflectedTypes = Reflection.getOwnMetadata("design:paramtypes", targetObject, key);

  return {
    ctxMetadata: {
      target,
      key,
      descriptor,
      static: false,
      reflectedTypes,
    },
    injMetadata,
    interceptors: [],
    guards: [],
    exceptionHandlers: [],
    pipes: [],
  };
}

function ensurePipe(method: EnhancersDefinitionMethod, decoratorInfo: Decorator, key: string | symbol, index: number): EnhancersDefinitionPipe {
  let pipe = method.pipes[index];
  if (pipe) {
    return pipe;
  }

  const reflectedType = Reflection.getOwnMetadata("design:paramtypes", decoratorInfo.class.prototype, key)[index];
  const metadata: ArgumentMetadata = {
    index,
    data: undefined,
    reflectedType,
  };

  return method.pipes[index] = { enhancers: [], metadata, extractor: defaultExtractor };
}

const enhancersPlural = {
  'interceptor': 'interceptors',
  'guard': 'guards',
  'exceptionHandler': 'exceptionHandlers',
  'pipe': 'pipes',
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
