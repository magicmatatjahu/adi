// import { Hook } from "./hook";
// import { wait, isProviderToken } from '../utils';

// import { InjectionToken } from "../tokens";

// import type { Session } from '../injector';
// import type { ProviderToken, InjectionHookResult, NextInjectionHook } from '../types';

// export type ConfigResultType<T, N> = T extends undefined ? N : T

// export function Config<T = undefined, NextValue = unknown>(token?: ProviderToken) {
//   const toSelf = !isProviderToken(token);

//   return Hook(
//     function configHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<ConfigResultType<T, NextValue>> {
//       if (toSelf) {
//         const parent = session.parent;
//         if (!parent) {
//           return undefined as any;
//         }
  
//         const config = parent.context.definition?.annotations.config;
//         if (isProviderToken(config)) {
//           session.inject.token = config;
//           return next(session);
//         }
//         return config as T
//       }
  
//       if (session.hasFlag('dry-run')) {
//         return next(session);
//       }
  
//       const forked = session.fork();
//       forked.setFlag('dry-run');
//       forked.inject.token = token;
//       return wait(
//         next(forked),
//         () => {
//           const config = forked.context.definition?.annotations.config;
//           if (isProviderToken(config)) {
//             session.inject.token = config;
//             return next(session);
//           }
//           return config as T
//         },
//       );
//     },
//     { name: 'adi:config' }
//   )
// }

// class A {}

// const token = InjectionToken.inject(A, Config())