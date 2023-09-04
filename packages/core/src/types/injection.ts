import { instancesToDestroyMetaKey } from '../private';

import type { Context, Injector, Session } from '../injector'
import type { InjectionHook } from './hook'
import type { ProviderToken, InferredProviderTokenType } from './provider-token'
import type { ProviderInstance } from './provider-record'
import type { ScopeDefinition } from './scope'
import type { InjectionKind } from '../enums'

export type InjectFunctionResult<T> = T | Promise<T>;

export interface InjectFunction {
  <T>(token: ProviderToken<T>): InjectFunctionResult<InferredInjectFunctionResult<T>>;
  <T, A>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>): InjectFunctionResult<A>;
  <T, A, B>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>): InjectFunctionResult<B>;
  <T, A, B, C>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectFunctionResult<C>;
  <T, A, B, C, D>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectFunctionResult<D>;
  <T, A, B, C, D, E>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectFunctionResult<E>;
  <T, A, B, C, D, E, F>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectFunctionResult<F>;
  <T, A, B, C, D, E, F, G>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectFunctionResult<G>;
  <T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectFunctionResult<H>;
  <T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
  <T>(token: ProviderToken<T>, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
  
  <T>(token: ProviderToken<T>, annotations: InjectionAnnotations): InjectFunctionResult<InferredInjectFunctionResult<T>>;
  <T, A>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>): InjectFunctionResult<A>;
  <T, A, B>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>): InjectFunctionResult<B>;
  <T, A, B, C>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectFunctionResult<C>;
  <T, A, B, C, D>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectFunctionResult<D>;
  <T, A, B, C, D, E>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectFunctionResult<E>;
  <T, A, B, C, D, E, F>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectFunctionResult<F>;
  <T, A, B, C, D, E, F, G>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectFunctionResult<G>;
  <T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectFunctionResult<H>;
  <T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
  <T>(token: ProviderToken<T>, annotations: InjectionAnnotations, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
  
  (annotations: InjectionAnnotations): InjectFunctionResult<unknown>;
  <A>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>): InjectFunctionResult<A>;
  <A, B>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>): InjectFunctionResult<B>;
  <A, B, C>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectFunctionResult<C>;
  <A, B, C, D>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectFunctionResult<D>;
  <A, B, C, D, E>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectFunctionResult<E>;
  <A, B, C, D, E, F>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectFunctionResult<F>;
  <A, B, C, D, E, F, G>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectFunctionResult<G>;
  <A, B, C, D, E, F, G, H>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectFunctionResult<H>;
  <A, B, C, D, E, F, G, H>(annotations: InjectionAnnotations, hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
  (annotations: InjectionAnnotations, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;

  <A>(hook1: InjectionHook<unknown, A>): InjectFunctionResult<A>
  <A, B>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>): InjectFunctionResult<B>;
  <A, B, C>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectFunctionResult<C>;
  <A, B, C, D>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectFunctionResult<D>;
  <A, B, C, D, E>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectFunctionResult<E>;
  <A, B, C, D, E, F>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectFunctionResult<F>;
  <A, B, C, D, E, F, G>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectFunctionResult<G>;
  <A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectFunctionResult<H>;
  <A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
  (...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
  
  <T>(token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, ...hooks: InjectionHook[]): InjectFunctionResult<T>;
}

export type InferredInjectFunctionResult<T> =
  InferredProviderTokenType<T> extends unknown ? T : InferredProviderTokenType<T>

export interface InjectionContext {
  injector: Injector;
  metadata: InjectionMetadata
  session?: Session;
  toDestroy?: ProviderInstance[]
}

export type InjectionItem<T = any> = 
  | ProviderToken<T>
  | InjectionHook<any, any>
  | Array<InjectionHook<any, any>>
  | PlainInjectionItem<T>;

export interface PlainInjectionItem<T = any> { 
  token?: ProviderToken<T>;
  hooks?: Array<InjectionHook<unknown, unknown>>; 
  annotations?: InjectionAnnotations;
};

export interface Injections {
  parameters?: Array<InjectionItem | undefined>;
  properties?: Record<string | symbol, InjectionItem>;
  methods?: Record<string | symbol, Array<InjectionItem | undefined>>;
  static?: {
    properties: Record<string | symbol, InjectionItem>;
    methods: Record<string | symbol, Array<InjectionItem | undefined>>;
  }
}

export type InjectionsOverride = (arg: InjectionItem) => InjectionItem | undefined;

export interface InjectionOptions<T = any> {
  token?: ProviderToken<T>;
  context?: Context;
  scope?: ScopeDefinition;
  annotations: InjectionAnnotations;
}

export interface InjectionArguments {
  parameters: Array<InjectionArgument | undefined>;
  properties: Record<string | symbol, InjectionArgument>;
  methods: Record<string | symbol, Array<InjectionArgument | undefined>>;
  static?: {
    properties: Record<string | symbol, InjectionArgument>;
    methods: Record<string | symbol, Array<InjectionArgument | undefined>>;
  };
}

export interface InjectionArgument<T = any> { 
  token?: ProviderToken<T>;
  hooks: Array<InjectionHook<any, any>>; 
  annotations: InjectionAnnotations;
  metadata: InjectionMetadata;
};

export interface InjectionMetadata {
  kind: InjectionKind;
  target?: Object;
  key?: string | symbol;
  index?: number;
  descriptor?: PropertyDescriptor;
  function?: (...args: any[]) => any;
  static?: boolean;
  annotations?: InjectionAnnotations;
}

export interface InjectionAnnotations {
  named?: string | symbol | object;
  tagged?: Array<string | symbol | object>;
  [key: string | symbol]: any;
}

export interface ParsedInjectionItem<T = any> { 
  token?: ProviderToken<T>;
  hooks: Array<InjectionHook<unknown, unknown>>; 
  annotations: InjectionAnnotations;
};