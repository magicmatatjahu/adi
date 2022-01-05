import { InjectionKind } from "../enums";
import { InjectorResolver, InjectorMetadata } from "../injector";
import { 
  Interceptor, StandaloneInterceptor,
  Guard, StandaloneGuard,
  ErrorHandler, StandaloneErrorHandler, 
  PipeTransform, StandalonePipeTransform,
  InjectionItem, ExtensionItem, FunctionInjections
} from "../interfaces";
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
  return function(target: Object, key?: string | symbol, method?: TypedPropertyDescriptor<any>) {
    applyExtensions(pipes, 'pipes', 'transform', target, key, method);
  }
}

export function Pipe(...pipes: (InjectionItem | PipeTransform | StandalonePipeTransform)[]) {
  return function(target: Object, key: string | symbol, index: number) {
    const method = getMethod(target, key);
    // method.pipes[index] = [...pipes as any];
  }
}

function applyExtensions(
  items: any[], 
  type: string,
  methodName: string,
  target: Object, 
  key?: string | symbol, 
  method?: TypedPropertyDescriptor<any>
) {
  target = target.constructor;
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
  method?: TypedPropertyDescriptor<any>
): ExtensionItem {
  if (typeof item === 'object' && typeof item[methodName] === 'function') {
    return {
      func: InjectorResolver.createFunction(item[methodName], item as FunctionInjections),
      arg: undefined,
    };
  }
  // change injection kind
  const arg = InjectorMetadata.convertDependency(item as InjectionItem, InjectionKind.METHOD, target, key, undefined, method && method.value);
  return { arg, func: undefined };
}
