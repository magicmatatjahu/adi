import { enhancersMixin, pipeMixin } from './definition';

import type { InjectionItem } from '@adi/core';
import type { Interceptor, StandaloneInterceptor, Guard, StandaloneGuard, ExceptionHandler, StandaloneExceptionHandler, PipeTransform, StandalonePipeTransform, ExtractorFactory, PipeDecorator, ExtractorOptions } from "./interfaces";

export function UseInterceptors(...interceptors: Array<InjectionItem | Interceptor | StandaloneInterceptor>) {
  return function(target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
    enhancersMixin(interceptors, 'interceptor', target, key, descriptor);
  }
}

export function UseGuards(...guards: Array<InjectionItem | Guard | StandaloneGuard>) {
  return function(target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
    enhancersMixin(guards, 'guard', target, key, descriptor);
  }
}

export function UseExceptionHandlers(...handlers: Array<InjectionItem | ExceptionHandler | StandaloneExceptionHandler>) {
  return function(target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
    enhancersMixin(handlers, 'exceptionHandler', target, key, descriptor);
  }
}

export function Pipe(...pipes: Array<InjectionItem | PipeTransform | StandalonePipeTransform>) {
  return function(target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
    enhancersMixin(pipes, 'pipe', target, key, descriptor);
  }
}

export function createExtractorDecorator<Data = unknown, Result = unknown>(
  factory: ExtractorFactory<Data, Result>,
  options?: ExtractorOptions,
  // decorators: ParameterDecorator[] = [], // think about it
): PipeDecorator {
  return function(data: Data, ...pipes: Array<InjectionItem | PipeTransform | StandalonePipeTransform>) {
    return function(target: Object, key: string | symbol, index: number) {
      pipeMixin(factory, data, pipes, target, key, index);
    }
  }
}
