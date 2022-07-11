// import { getInjectableDefinition } from '@adi/core/lib/decorators';

// import type { InjectionItem, StandaloneInjections } from '@adi/core';

// import type { ExecutionContext } from "./execution-context";
// import type {
//   Middleware, StandaloneMiddleware,
//   Interceptor, StandaloneInterceptor,
//   Guard, StandaloneGuard,
//   ExceptionHandler, StandaloneExceptionHandler,
// } from "./interfaces";

// export function UseMiddlewares(...interceptors: Array<InjectionItem | Middleware | StandaloneMiddleware>) {
//   return function(target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
//     applyEnhancers(interceptors, 'middlewares', 'use', target, key, descriptor);
//   }
// }

// export function UseInterceptors(...interceptors: Array<InjectionItem | Interceptor | StandaloneInterceptor>) {
//   return function(target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
//     applyEnhancers(interceptors, 'interceptors', 'intercept', target, key, descriptor);
//   }
// }

// export function UseGuards(...guards: Array<InjectionItem | Guard | StandaloneGuard>) {
//   return function(target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
//     applyEnhancers(guards, 'guards', 'canPerform', target, key, descriptor);
//   }
// }

// export function UseExceptionHandlers(...handlers: Array<InjectionItem | ExceptionHandler | StandaloneExceptionHandler>) {
//   return function(target: Object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) {
//     applyEnhancers(handlers, 'eHandlers', 'catch', target, key, descriptor);
//   }
// }

// function applyEnhancers(
//   items: any[], 
//   type: string,
//   methodName: string,
//   target: Object, 
//   key?: string | symbol, 
//   descriptorOrIndex?: TypedPropertyDescriptor<any> | number,
// ) {
//   if (key !== undefined) {
//     target = target.constructor
//   }
//   const def = getInjectableDefinition(target);

//   // defined on method level
//   if (descriptorOrIndex) {
//     const converted = items.map(item => convertItem(item, methodName, target, key, descriptorOrIndex));
//     const method = getMethod(target, key);
//     method[type] = [...converted, ...method[type]];
//     return;
//   }
//   // defined on class level
//   if (!def) return;
//   Object.values(def.injections.methods).forEach(method => {
//     const converted = items.map(item => convertItem(item, methodName, target, undefined, undefined, method.handler));
//     method[type] = [...converted, ...method[type]];
//   });
// }

// function convertItem<T>(
//   item: InjectionItem | StandaloneInjections | T,
//   methodName: string,
//   target: Object, 
//   key?: string | symbol, 
//   descriptorOrIndex?: TypedPropertyDescriptor<any> | number,
//   handler?: Function,
// ): ExtensionItem {
//   if (typeof item === 'object' && typeof item[methodName] === 'function') {
//     if ((item as StandaloneInjections).inject) {
//       return {
//         type: 'func',
//         arg: [item[methodName], item as StandaloneInjections],
//       };
//     }
//     return {
//       type: 'val',
//       arg: item,
//     };
//   }

//   // change injection kind
//   const arg = convertInjectionDependency(
//     item as InjectionItem, 
//     InjectionKind.METHOD, 
//     target, 
//     key, 
//     typeof descriptorOrIndex === 'number' ? descriptorOrIndex : undefined, 
//     handler || (descriptorOrIndex && (descriptorOrIndex as TypedPropertyDescriptor<any>).value) 
//   );
//   return { type: 'inj', arg };
// }