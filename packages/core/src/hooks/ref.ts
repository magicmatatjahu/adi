import { Hook } from "./hook";
import { wait } from '../utils';

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook, ProviderToken } from '../types';

export function Ref<NextValue, T>(ref: () => ProviderToken<T> | Promise<ProviderToken<T>>) {
  let token: ProviderToken<T> | undefined;
  return Hook(
    function refHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<T> {
      return wait(
        token === undefined ? ref() : token,
        result => {
          session.token = token = result;
          return next(session) as T;
        }
      );
    },
    { name: 'adi:ref' }
  )
}
