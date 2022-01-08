import { InjectionKind } from "../enums";
import { 
  Middleware, StandaloneMiddleware,
  Interceptor, StandaloneInterceptor,
  Guard, StandaloneGuard,
  ErrorHandler, StandaloneErrorHandler, 
  PipeTransform, StandalonePipeTransform, ParamDecoratorOptions, PipeDecorator, PipeFactory, ArgumentMetadata,
  InjectionItem, ExtensionItem, FunctionInjections
} from "../interfaces";
import { Reflection } from "../utils";
import { getMethod, getProviderDef } from "./injectable";

import { ExecutionContext } from "../injector/execution-context";
import { convertDependency as convertInjectionDependency } from "../injector/metadata";

export function UseMiddlewares(...interceptors: (InjectionItem | Middleware | StandaloneMiddleware)[]) {
  return function(target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
    applyExtensions(interceptors, 'middlewares', 'use', target, key, descriptor);
  }
}

export function UseInterceptors(...interceptors: (InjectionItem | Interceptor | StandaloneInterceptor)[]) {
  return function(target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
    applyExtensions(interceptors, 'interceptors', 'intercept', target, key, descriptor);
  }
}

export function UseGuards(...guards: (InjectionItem | Guard | StandaloneGuard)[]) {
  return function(target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
    applyExtensions(guards, 'guards', 'canPerform', target, key, descriptor);
  }
}

export function UseErrorHandlers(...handlers: (InjectionItem | ErrorHandler | StandaloneErrorHandler)[]) {
  return function(target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
    applyExtensions(handlers, 'eHandlers', 'catch', target, key, descriptor);
  }
}

export function UsePipes(...pipes: (InjectionItem | PipeTransform | StandalonePipeTransform)[]) {
  return function(target: Object, key?: string | symbol, descriptorOrIndex?: TypedPropertyDescriptor<any> | number) {
    if (key !== undefined) {
      target = target.constructor
    }

    // defined on method level
    if (descriptorOrIndex || typeof descriptorOrIndex === 'number') {
      const converted = pipes.map(item => convertDependency(item, 'transform', target, key, descriptorOrIndex));
      const method = getMethod(target, key);
      if (typeof descriptorOrIndex === 'number') {
        if (method.pipes[descriptorOrIndex]) method.pipes[descriptorOrIndex].pipes = converted;
        else {
          const metatype = Reflection.getOwnMetadata("design:paramtypes", (target as any).prototype, key)[descriptorOrIndex];
          method.pipes[descriptorOrIndex] = {
            extractor: defaultExtractor(descriptorOrIndex),
            metadata: { 
              type: '', 
              index: descriptorOrIndex, 
              metatype,
              data: undefined,
            },
            pipes: converted,
          }
        }
        return;
      }
      method.pipes.forEach(pipe => pipe.pipes = [...converted, ...pipe.pipes]);
      return;
    }
    
    // defined on class level
    const def = getProviderDef(target);
    if (!def) return;
    const methods = def.injections.methods;
    Object.values(methods).forEach(method => {
      const converted = pipes.map(item => convertDependency(item, 'transform', target, undefined, undefined, method.handler));
      method.pipes.forEach(pipe => pipe.pipes = [...converted, ...pipe.pipes]);
    });
  }
}

export function defaultExtractor(index: number) {
  return function(ctx: ExecutionContext) { return ctx.getArgs(index) }
}

export function createParamDecorator<
  Data = unknown,
  Result = unknown,
>(
  factory: PipeFactory<Data, Result>,
  options: ParamDecoratorOptions,
  decorators: ParameterDecorator[] = [],
): PipeDecorator<Data> {
  const decorator: PipeDecorator = (data: Data) => {
    return function(target: Object, key: string | symbol, index: number) {
      const metatype = Reflection.getOwnMetadata("design:paramtypes", target, key)[index];
      const method = getMethod(target.constructor, key);
      const metadata: ArgumentMetadata<Data> = {
        type: options.name,
        metatype,
        index,
        data,
      };
      if (method.pipes[index]) {
        method.pipes[index].extractor = (ctx) => factory(metadata, ctx);
        method.pipes[index].metadata = metadata;
      } else {
        method.pipes[index] = {
          extractor: (ctx) => factory(metadata, ctx),
          metadata,
          pipes: [],
        }
      }
      if (Array.isArray(decorator.decorators)) {
        decorator.decorators.forEach(fn => fn(target, key, index));
      }
      decorators.forEach(fn => fn(target, key, index));
    }
  }
  return decorator;
}

function applyExtensions(
  items: any[], 
  type: string,
  methodName: string,
  target: Object, 
  key?: string | symbol, 
  descriptorOrIndex?: TypedPropertyDescriptor<any> | number,
) {
  if (key !== undefined) {
    target = target.constructor
  }
  // defined on method level
  if (descriptorOrIndex) {
    const converted = items.map(item => convertDependency(item, methodName, target, key, descriptorOrIndex));
    const method = getMethod(target, key);
    method[type] = [...converted, ...method[type]];
    return;
  }
  // defined on class level
  const def = getProviderDef(target);
  if (!def) return;
  Object.values(def.injections.methods).forEach(method => {
    const converted = items.map(item => convertDependency(item, methodName, target, undefined, undefined, method.handler));
    method[type] = [...converted, ...method[type]];
  });
}

function convertDependency<T>(
  item: InjectionItem | FunctionInjections | T,
  methodName: string,
  target: Object, 
  key?: string | symbol, 
  descriptorOrIndex?: TypedPropertyDescriptor<any> | number,
  handler?: Function,
): ExtensionItem {
  if (typeof item === 'object' && typeof item[methodName] === 'function') {
    if ((item as FunctionInjections).inject) {
      return {
        type: 'func',
        arg: [item[methodName], item as FunctionInjections],
      };
    }
    return {
      type: 'val',
      arg: item,
    };
  }
  // change injection kind
  const arg = convertInjectionDependency(
    item as InjectionItem, 
    InjectionKind.METHOD, 
    target, 
    key, 
    typeof descriptorOrIndex === 'number' ? descriptorOrIndex : undefined, 
    handler || (descriptorOrIndex && (descriptorOrIndex as TypedPropertyDescriptor<any>).value) 
  );
  return { type: 'inj', arg };
}
