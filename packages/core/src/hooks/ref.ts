import { createHook } from "./create-hook";
import { wait } from '../utils';

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook, ProviderToken } from '../types';

export const Ref = createHook(<RT>(ref: () => ProviderToken<RT> | Promise<ProviderToken<RT>>) => {
  let token: ProviderToken<RT> | undefined;
  return <ResultType>(session: Session, next: NextInjectionHook<ResultType>): InjectionHookResult<RT> => {
    return wait(
      token === undefined ? ref() : token,
      result => {
        session.inject.token = token = result;
        return next(session) as RT;
      }
    );
  }
}, { name: 'adi:hook:ref' });
