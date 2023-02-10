import { createHook, wait } from '@adi/core';

import { OVERRIDE_KEY } from './override';

// function override(injector: Injector, deep: boolean) {
//   return function override(arg: InjectionArgument): InjectionItem {
//     const basicWrappers = [WithInjector(injector)];
//     if (arg.wrapper) {
//       Array.isArray(arg.wrapper) ? basicWrappers.push(...arg.wrapper) : basicWrappers.push(arg.wrapper);
//     }
//     deep === true && basicWrappers.unshift(Portal({ deep: true, injector } as any));
//     return { token: arg.token, wrapper: basicWrappers as Wrapper[] };
//   }
// }

export const Portal = createHook(() => {
  return (session, next) => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    // set dry-run to retrieve updated session
    session.hasFlag('dry-run');
    // session.annotations[OVERRIDE_KEY] = override;
    return wait(
      next(session),
      () => {
        return next(session);
      }
    )
  }
}, { name: 'adi:hook:portal' });
