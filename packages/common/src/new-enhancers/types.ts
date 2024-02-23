import type { CustomResolver, InjectionItem } from '@adi/core';
import type { ExecutionContext } from './execution-context';

export type EnhancerType = 
  | InterceptorType
  | GuardType
  | ExceptionHandlerType
  | PipeTransformType
  | InjectionItem;

export type EnhancerKind = 'interceptor' | 'guard' | 'exceptionHandler' | 'pipe';
export type EnhancerMethod = 'intercept' | 'canPerform' | 'catch' | 'transform';

export type EnhancerItem = CustomResolver;

export type NextEnhancer = (ctx: ExecutionContext) => void;

export type EnhancersDefinition = {
  readonly class: EnhancersClassList;
  readonly methods: Record<string | symbol, EnhancersMethodList>;
}

export interface EnhancersClassList {
  readonly guards: EnhancerItem[];
  readonly interceptors: EnhancerItem[];
  readonly pipes: EnhancerItem[];
  readonly exceptionHandlers: EnhancerItem[];
}

export interface EnhancersMethodList {
  readonly guards: EnhancerItem[];
  readonly interceptors: EnhancerItem[];
  readonly pipes: EnhancerItem[];
  readonly extractors: Array<{
    extractor: CustomResolver<PipeExtractor>;
    readonly pipes: EnhancerItem[];
  } | undefined>;
  readonly exceptionHandlers: EnhancerItem[];
}

export interface ExecutionContextKind {
  'adi:function-call': any[];
}

export interface ExecutionContextMetadata {
  target: Object;
  key: string | symbol;
  descriptor: PropertyDescriptor;
}

export interface Guard {
  canPerform(context: ExecutionContext): boolean | Promise<boolean>;
};

export interface StandaloneGuard {
  canPerform(context: ExecutionContext, ...injections: any[]): boolean | Promise<boolean>;
  inject?: Array<InjectionItem>;
};

export type GuardType = 
  | Guard
  | StandaloneGuard
  | InjectionItem;

export interface NextInterceptor<R = any> {
  (): R | Promise<R>;
};

export interface Interceptor<R = any> {
  intercept(context: ExecutionContext, next: NextInterceptor): R | Promise<R>;
};

export interface StandaloneInterceptor<R = any> {
  intercept(context: ExecutionContext, next: NextInterceptor, ...injections: any[]): R | Promise<R>;
  inject?: Array<InjectionItem>;
};

export type InterceptorType = 
  | Interceptor
  | StandaloneInterceptor
  | InjectionItem;

export interface NextExceptionHandler<R = any> {
  (): R | Promise<R>;
};

export interface ExceptionHandler<T = unknown, R = any> {
  catch(error: T, context: ExecutionContext, next: NextExceptionHandler): R | Promise<R>;
};

export interface StandaloneExceptionHandler<T = unknown, R = any> {
  catch(error: T, context: ExecutionContext, next: NextExceptionHandler, ...injections: any[]): R | Promise<R>;
  inject?: Array<InjectionItem>;
};

export type ExceptionHandlerType = 
  | ExceptionHandler
  | StandaloneExceptionHandler
  | InjectionItem;

export interface PipeTransform<T = any, R = any> {
  transform(value: T, argument: ArgumentMetadata, context: ExecutionContext): R | Promise<R>;
}

export interface StandalonePipeTransform<T = any, R = any> {
  transform(value: T, argument: ArgumentMetadata, context: ExecutionContext, ...injections: any[]): R | Promise<R>;
  inject?: Array<InjectionItem>;
};

export type PipeTransformType =
  | PipeTransform
  | StandalonePipeTransform
  | InjectionItem;

export interface ArgumentMetadata<Data = unknown> {
  type: string;
  data: Data;
  index: number;
  reflectedType: any;
}

export interface PipeExtractor<Data = unknown, Result = unknown> {
  extract(argument: ArgumentMetadata<Data>, context: ExecutionContext): Result | Promise<Result>;
}

export interface StandalonePipeExtractor<Data = unknown, Result = unknown> {
  extract(argument: ArgumentMetadata<Data>, context: ExecutionContext, ...injections: any[]): Result | Promise<Result>;
  inject?: Array<InjectionItem>;
}

export type PipeExtractorType<Data = unknown, Result = unknown> = 
  | PipeExtractor<Data, Result>
  | StandalonePipeExtractor<Data, Result>
  | InjectionItem;

export type PipeExtractorDecorator<Data = unknown> = (data: Data, pipes: PipeTransformType | Array<PipeTransformType>) => ParameterDecorator;

export interface PipeExtractorOptions {
  type: string
  name?: string;
} 
