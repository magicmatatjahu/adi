import type { Session, ClassType, InjectionItem, InjectionAnnotations, InjectionMetadata } from '@adi/core';
import type { ExecutionContext, ExecutionContextMetadata } from './execution-context';

export interface Enhancer {

}

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
  index: number;
  data: Data;
  reflectedType: any;
}

export type ExtractorFactory<Data = unknown, Result = unknown> = (metadata: ArgumentMetadata<Data>, context: ExecutionContext) => Result;
export type PipeDecorator<Data = unknown> = (data: Data, ...pipes: Array<InjectionItem | PipeTransform | StandalonePipeTransform>) => ParameterDecorator;

export interface ExtractorOptions {
  name?: string;
} 

export type EnhancerType = 
  | ClassType<Interceptor> | Interceptor | StandaloneInterceptor
  | ClassType<Guard> | Guard | StandaloneGuard
  | ClassType<PipeTransform> | PipeTransform | StandaloneExceptionHandler
  | ClassType<ExceptionHandler> | ExceptionHandler | StandalonePipeTransform
  | InjectionItem;

export type EnhancerKind = 'interceptor' | 'guard' | 'exceptionHandler' | 'pipe';
export type EnhancerMethod = 'intercept' | 'canPerform' | 'catch' | 'transform';

export interface EnhancerMetadata {
  kind: EnhancerKind,
  target?: Object;
  key?: string | symbol;
  index?: number;
  descriptor?: PropertyDescriptor;
  function?: (...args: any[]) => any;
  static?: boolean;
  annotations?: InjectionAnnotations;
}

export interface EnhancerItem {
  resolver: (session: Session) => unknown;
}

export type EnhancersDefinition = {
  readonly methods: Record<string | symbol, EnhancersDefinitionMethod>;
}

export type EnhancersDefinitionPipe = {
  readonly enhancers: EnhancerItem[];
  readonly extractor: ExtractorFactory;
  readonly metadata: ArgumentMetadata;
}

export interface EnhancersDefinitionMethod {
  readonly ctxMetadata: ExecutionContextMetadata;
  readonly injMetadata: InjectionMetadata;
  readonly interceptors: EnhancerItem[];
  readonly guards: EnhancerItem[];
  readonly exceptionHandlers: EnhancerItem[];
  readonly pipes: EnhancersDefinitionPipe[];
}
