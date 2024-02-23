import { createArray } from '@adi/core/lib/utils';

import { applyEnhancers, applyPipeExtractor } from './enhancers';

import type { InterceptorType, GuardType, ExceptionHandlerType, PipeTransformType, PipeExtractorType, PipeExtractorDecorator, PipeExtractorOptions } from "./types";

export function UseInterceptors(...interceptors: Array<InterceptorType>) {
  return function(target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
    applyEnhancers(target, key, descriptor, 'interceptors', interceptors);
  }
}

export function UseGuards(...guards: Array<GuardType>) {
  return function(target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
    applyEnhancers(target, key, descriptor, 'guards', guards);
  }
}

export function UseExceptionHandlers(...handlers: Array<ExceptionHandlerType>) {
  return function(target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
    applyEnhancers(target, key, descriptor, 'exceptionHandlers', handlers);
  }
}

export function UsePipes(...pipes: Array<PipeTransformType>) {
  return function(target: Object, key?: string | symbol, descriptorOrIndex?: TypedPropertyDescriptor<any> | number) {
    if (typeof descriptorOrIndex === 'number') {
      return applyPipeExtractor(target, key as string | symbol, descriptorOrIndex, pipes);
    }
    applyEnhancers(target, key, descriptorOrIndex, 'pipes', pipes);
  }
}

export function UseEnhancers() {
  return function(target: Object, key: string | symbol, descriptor: TypedPropertyDescriptor<any>) {
    applyEnhancers(target, key, descriptor, 'empty')
  }
}

export function createPipeExtractor<Data = unknown, Result = unknown>(
  extractor: PipeExtractorType<Data, Result>,
  options: PipeExtractorOptions,
): PipeExtractorDecorator<Data> {
  return function(data: Data, pipes: PipeTransformType | Array<PipeTransformType>) {
    return function(target: Object, key: string | symbol | undefined, index: number) {
      applyPipeExtractor(target, key as string | symbol, index, createArray(pipes), extractor, data, options);
    }
  }
}
