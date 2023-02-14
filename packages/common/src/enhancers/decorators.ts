import { applyEnhancers, applyPipes } from './definition';

import type { InterceptorType, GuardType, ExceptionHandlerType, PipeTransformType, PipeDecorator, ExtractorFactory, ExtractorOptions } from "./interfaces";

export function UseInterceptors(...interceptors: Array<InterceptorType>) {
  return function(target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
    applyEnhancers(interceptors, 'interceptor', target, key, descriptor);
  }
}

export function UseGuards(...guards: Array<GuardType>) {
  return function(target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
    applyEnhancers(guards, 'guard', target, key, descriptor);
  }
}

export function UseExceptionHandlers(...handlers: Array<ExceptionHandlerType>) {
  return function(target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
    applyEnhancers(handlers, 'exceptionHandler', target, key, descriptor);
  }
}

export function UsePipes(...pipes: Array<PipeTransformType>) {
  return function(target: Object, key?: string | symbol, descriptorOrIndex?: TypedPropertyDescriptor<any> | number) {
    applyPipes(pipes, target, key, descriptorOrIndex);
  }
}

export function createExtractorDecorator<Data = unknown, Result = unknown>(
  factory: ExtractorFactory<Data, Result>,
  options?: ExtractorOptions,
  // decorators: ParameterDecorator[] = [], // think about it
): PipeDecorator {
  return function(data: Data, ...pipes: Array<PipeTransformType>) {
    return function(target: Object, key: string | symbol, index: number) {
      applyPipes(pipes, target, key, index, factory, data);
    }
  }
}
