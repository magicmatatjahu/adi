import type { StandaloneInjections, ClassType, ResolverDefinition } from '@adi/core';

import type { ExecutionContext } from './execution-context';

export interface Interceptor<R = any> {
  intercept(context: ExecutionContext, next: NextInterceptor): R | Promise<R>;
};

export interface StandaloneInterceptor<R = any> extends StandaloneInjections {
  intercept(context: ExecutionContext, next: NextInterceptor, ...injections: any[]): R | Promise<R>;
};

export interface NextInterceptor<R = any> {
  (): R | Promise<R>;
};

export interface Guard {
  canPerform(context: ExecutionContext): boolean | Promise<boolean> | any;
};

export interface StandaloneGuard extends StandaloneInjections {
  canPerform(context: ExecutionContext, ...injections: any[]): boolean | Promise<boolean> | any;
};

export interface ExceptionHandler<T extends Error = Error, R = any> {
  catch(error: T, context: ExecutionContext): R | Promise<R>;
};

export interface StandaloneExceptionHandler<T extends Error = Error, R = any> extends StandaloneInjections {
  catch(error: T, context: ExecutionContext, ...injections: any[]): R | Promise<R>;
};

export interface PipeTransform<T = any, R = any> {
  transform(value: T, argMetadata: ArgumentMetadata, context: ExecutionContext): R | Promise<R>;
}

export interface StandalonePipeTransform<T = any, R = any> extends StandaloneInjections {
  transform(value: T, argMetadata: ArgumentMetadata, context: ExecutionContext, ...injections: any[]): R | Promise<R>;
};

export interface ArgumentMetadata<Data = unknown> {
  readonly type: string;
  readonly metatype: ClassType<any> | undefined;
  readonly index: number; 
  readonly data: Data;
}

export interface PipeItem<Data = unknown> {
  extractor: (ctx: ExecutionContext) => unknown;
  metadata: ArgumentMetadata<Data>
  pipes: EnhancerItem[];
}

export interface EnhancerItem {
  resolver: ResolverDefinition;
  data: any;
}

export interface EnhancersMetadata {
  readonly interceptors: EnhancerItem[];
  readonly guards: EnhancerItem[];
  readonly eHandlers: EnhancerItem[];
  readonly pipes: PipeItem[];
}
