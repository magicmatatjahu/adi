// import { Type, FactoryProvider } from "@adi/core";
// import { UseClassFactoryProvider } from "../interfaces";

// export function useClassFactory<T = any, C = any, P = any>(options: UseClassFactoryProvider<C, P>): FactoryProvider<T> {
//   const methodName = options.methodName || 'useFactory'
//   const provider = {
//     provide: options.provide,
//     useFactory: (_: C) => void 0,
//     inject: [options.useFactory],
//     scope: options.scope,
//   };
//   provider.useFactory = (classFactory: C) => {
//     if (typeof classFactory[methodName] === 'function') {
//       provider.useFactory = (cf: C) => cf[methodName](options.params);
//       return classFactory[methodName](options.params);
//     } else {
//       throw Error("Where is my useFactory?!");
//     }
//   }
//   return provider;
// }
