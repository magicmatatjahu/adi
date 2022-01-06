import { InjectionKind } from "../enums";
import { InjectorResolver, InjectorMetadata } from "../injector";
import { 
  Interceptor, StandaloneInterceptor,
  Guard, StandaloneGuard,
  ErrorHandler, StandaloneErrorHandler, 
  PipeTransform, StandalonePipeTransform, PipeDecorator, PipeFactory, ArgumentMetadata,
  InjectionItem, ExtensionItem, FunctionInjections
} from "../interfaces";
import { Reflection } from "../utils";
import { getMethod, getProviderDef } from "./injectable";

export function UseInterceptors(...interceptors: (InjectionItem | Interceptor | StandaloneInterceptor)[]) {
  return function(target: Object, key?: string | symbol, method?: TypedPropertyDescriptor<any>) {
    applyExtensions(interceptors, 'interceptors', 'intercept', target, key, method);
  }
}

export function UseGuards(...guards: (InjectionItem | Guard | StandaloneGuard)[]) {
  return function(target: Object, key?: string | symbol, method?: TypedPropertyDescriptor<any>) {
    applyExtensions(guards, 'guards', 'canPerform', target, key, method);
  }
}

export function UseErrorHandlers(...handlers: (InjectionItem | ErrorHandler | StandaloneErrorHandler)[]) {
  return function(target: Object, key?: string | symbol, method?: TypedPropertyDescriptor<any>) {
    applyExtensions(handlers, 'eHandlers', 'catch', target, key, method);
  }
}

export function UsePipes(...pipes: (InjectionItem | PipeTransform | StandalonePipeTransform)[]) {
  return function(target: Object, key?: string | symbol, descriptorOrIndex?: TypedPropertyDescriptor<any> | number) {
    if (key !== undefined) {
      target = target.constructor
    }
    const converted = pipes.map(item => convertDependency(item as any, 'transform', target, key, descriptorOrIndex));

    // defined on method level
    if (descriptorOrIndex) {
      const method = getMethod(target, key);
      if (typeof descriptorOrIndex === 'number' && method.pipes[descriptorOrIndex]) {
        const index = method.pipes[descriptorOrIndex];
        method.pipes[descriptorOrIndex].pipes = converted;
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
      method.pipes.forEach(pipe => pipe.pipes = [...converted, ...pipe.pipes]);
    });
  }
}

export function createParameterDecorator<
  Data = unknown,
  Result = unknown,
>(
  factory: PipeFactory<Data, Result>,
  type: string,
  decorators: ParameterDecorator[] = [],
): PipeDecorator<Data> {
  const decorator: PipeDecorator = (data: Data) => {
    return function(target: Object, key: string | symbol, index: number) {
      const metatype = Reflection.getOwnMetadata("design:paramtypes", target, key)[index];
      const method = getMethod(target.constructor, key);
      const metadata: ArgumentMetadata<Data> = {
        type,
        metatype,
        index,
        data,
      };
      method.pipes[index] = {
        decorator: (ctx) => factory(metadata, ctx),
        metadata,
        pipes: [],
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
  method?: TypedPropertyDescriptor<any>
) {
  if (key !== undefined) {
    target = target.constructor
  }
  const converted = items.map(item => convertDependency(item, methodName, target, key, method));
  // defined on method level
  if (method) {
    const method = getMethod(target, key);
    method[type] = [...converted, ...method[type]];
    return;
  }
  // defined on class level
  const def = getProviderDef(target);
  if (!def) return;
  const methods = def.injections.methods;
  Object.values(methods).forEach(method => {
    method[type] = [...converted, ...method[type]];
  });
}

// TODO: Handle instance of classes
function convertDependency(
  item: InjectionItem | FunctionInjections,
  methodName: string,
  target: Object, 
  key?: string | symbol, 
  method?: TypedPropertyDescriptor<any> | number,
): ExtensionItem {
  if (typeof item === 'object' && typeof item[methodName] === 'function') {
    return {
      func: InjectorResolver.createFunction(item[methodName], item as FunctionInjections),
      arg: undefined,
    };
  }
  // change injection kind
  const arg = InjectorMetadata.convertDependency(
    item as InjectionItem, 
    InjectionKind.METHOD, 
    target, 
    key, 
    typeof method === 'number' ? method : undefined, 
    typeof method !== 'number' ? method.value : undefined
  );
  return { arg, func: undefined };
}
