import { instancesToDestroyMetaKey } from '../private';

import type { Context, Injector, Session } from '../injector'
import type { InjectionHook } from './hook'
import type { ProviderToken, InferredProviderTokenType } from './provider-token'
import type { ProviderInstance } from './provider-record'
import type { ScopeDefinition } from './scope'
import type { InjectionKind } from '../enums'

export type InjectFunctionResult<T> = T | Promise<T>;

export interface InjectFunction {
  <T extends ProviderToken<any>>(token: T): InjectFunctionResult<InferredProviderTokenType<T>>;
  <T extends ProviderToken<any>>(token: T, annotations: InjectionAnnotations): InjectFunctionResult<InferredProviderTokenType<T>>;
  <T extends ProviderToken<any>>(token: T, ...hooks: Array<InjectionHook<unknown, unknown>>): InjectFunctionResult<unknown>;

  <T extends ProviderToken<any>, A>(token: T, hook1: InjectionHook<InferredProviderTokenType<T>, A>): InjectFunctionResult<A>;
  <T extends ProviderToken<any>, A, B>(token: T, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>): InjectFunctionResult<B>;
  <T extends ProviderToken<any>, A, B, C>(token: T, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectFunctionResult<C>;
  <T extends ProviderToken<any>, A, B, C, D>(token: T, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectFunctionResult<D>;
  <T extends ProviderToken<any>, A, B, C, D, E>(token: T, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectFunctionResult<E>;
  <T extends ProviderToken<any>, A, B, C, D, E, F>(token: T, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectFunctionResult<F>;
  <T extends ProviderToken<any>, A, B, C, D, E, F, G>(token: T, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectFunctionResult<G>;
  <T extends ProviderToken<any>, A, B, C, D, E, F, G, H>(token: T, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectFunctionResult<H>;


  <T extends ProviderToken<any>, A>(token: T, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>): InjectFunctionResult<A>;
  <T extends ProviderToken<any>, A, B>(token: T, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>): InjectFunctionResult<B>;
  <T extends ProviderToken<any>, A, B, C>(token: T, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectFunctionResult<C>;
  <T extends ProviderToken<any>, A, B, C, D>(token: T, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectFunctionResult<D>;
  <T extends ProviderToken<any>, A, B, C, D, E>(token: T, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectFunctionResult<E>;
  <T extends ProviderToken<any>, A, B, C, D, E, F>(token: T, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectFunctionResult<F>;
  <T extends ProviderToken<any>, A, B, C, D, E, F, G>(token: T, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectFunctionResult<G>;
  <T extends ProviderToken<any>, A, B, C, D, E, F, G, H>(token: T, annotations: InjectionAnnotations, hook1: InjectionHook<InferredProviderTokenType<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectFunctionResult<H>;

  <A>(hook1: InjectionHook<unknown, A>): A
  <A, B>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>): InjectFunctionResult<B>;
  <A, B, C>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectFunctionResult<C>;
  <A, B, C, D>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectFunctionResult<D>;
  <A, B, C, D, E>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectFunctionResult<E>;
  <A, B, C, D, E, F>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectFunctionResult<F>;
  <A, B, C, D, E, F, G>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectFunctionResult<G>;
  <A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectFunctionResult<H>;
  (...hooks: Array<InjectionHook<unknown, unknown>>): InjectFunctionResult<unknown>;

  <T extends ProviderToken<any>>(tokenAnnotationOrHook: T | InjectionAnnotations | InjectionHook<unknown, unknown>, ...hooks: Array<InjectionHook<unknown, unknown>>): InjectFunctionResult<unknown>;
  <T extends ProviderToken<any>>(tokenAnnotationOrHook: T | InjectionAnnotations | InjectionHook<unknown, unknown>, annotationOrHook?: InjectionAnnotations | InjectionHook<unknown, unknown>, ...hooks: Array<InjectionHook<unknown, unknown>>): InjectFunctionResult<unknown>;
}

// function get(token) {
//   return token as any
// } as typeof InjectFunction

// const result = get('lol')

export interface InjectionContext {
  injector: Injector;
  metadata: InjectionMetadata
  session?: Session;
  [instancesToDestroyMetaKey]?: ProviderInstance[]
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