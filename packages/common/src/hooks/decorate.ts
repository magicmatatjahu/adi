// import { createHook, SessionFlag, wait, ClassType, InjectionItem, InjectionKind } from '@adi/core';
// import { getInjectableDefinition } from '@adi/core/lib/decorators';
// import { convertDependencies, resolverClass, resolverFunction } from '@adi/core/lib/injector';

// import type { Injector, Session } from '@adi/core';

// export type DecorateHookOptions = 
//   | ClassType
//   | DecorateClass
//   | DecorateFunction;

// interface DecorateClass {
//   useClass: ClassType;
//   delegationKey: string | symbol;
// }

// interface DecorateFunction<T = any> {
//   decorate: (decorated: T, ...args: any[]) => any;
//   inject?: Array<InjectionItem>;
// }

// function isDecorateClass(decorator: unknown): decorator is DecorateClass {
//   return 'useClass' in (decorator as DecorateClass);
// }

// function isDecorateFunction(decorator: unknown): decorator is DecorateFunction {
//   return typeof (decorator as DecorateFunction).decorate === 'function';
// }

// // uniqueID is used to avoid redecorate the given instance
// let uniqueID = 0;

// export const Decorate = createHook((options: DecorateHookOptions) => {
//   // decoratorID is added to the every instances with `true` value to avoid redecorate the given instance
//   const metaKey = `adi:decorator:${uniqueID++}`;
//   let resolver: (injector: Injector, session: Session, value?: any) => any;
//   let delegationKey: string | symbol;

//   if (isDecorateFunction(options)) { // function based decorator
//     const data = { useFunction: options.decorate, inject: convertDependencies(options.inject || [], { kind: InjectionKind.FACTORY, handler: options.decorate }) };
//     resolver = (injector: Injector, session: Session, value?: any) => resolverFunction(injector, session, data, value);
//   } else if (isDecorateClass(options)) { // classType based decorator with `useClass` property
//     const def = getInjectableDefinition(options.useClass);
//     resolver = (injector: Injector, session: Session) => resolverClass(injector, session, { useClass: options.useClass, inject: def.injections });
//     delegationKey = options.delegationKey || 'decorate';
//   } else { // classType based decorator
//     const def = getInjectableDefinition(options);
//     resolver = (injector: Injector, session: Session) => resolverClass(injector, session, { useClass: options, inject: def.injections });
//     delegationKey = 'decorate';
//   }

//   return (session, next) => {
//     if (session.hasFlag(SessionFlag.DRY_RUN)) {
//       return next(session);
//     }

//     // fork session and resolve the original value
//     const forked = session.fork();
//     return wait(
//       next(session),
//       decorated => {
//         const sessionInstance = session.context.instance;

//         // if it has been decorated before, return value.
//         if (sessionInstance.meta[metaKey]) {
//           return decorated;
//         }

//         if (delegationKey) { // classType based decorator
//           if (forked.annotations['adi:delegations']) {
//             forked.annotations['adi:delegations'][delegationKey] = decorated;
//           } else {
//             forked.annotations['adi:delegations'] = {
//               [delegationKey]: decorated,
//             }
//           }
//         };

//         // resolve decorator and save decorated value to the instance value
//         return wait(
//           resolver(forkedSession.ctx.injector, forkedSession, decorated),
//           value => {
//             // possible problem with async resolution - check again
//             if (sessionInstance.meta[metaKey]) {
//               return value;
//             }
//             sessionInstance.meta[metaKey] = true;
//             sessionInstance.value = value;
//             return value;
//           }
//         )
//       }
//     );
//   }
// }, { name: "adi:hook:decorate" });
