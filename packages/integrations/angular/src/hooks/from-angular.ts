import { Hook } from "@adi/core";
import { isProviderToken } from "@adi/core/lib/utils";

import { ANGULAR_INJECTOR } from '../tokens';

import type { Session, NextInjectionHook, InjectionHookResult } from '@adi/core';
import type { ProviderToken, InjectOptions } from '@angular/core';

export function FromAngular<NextValue, T>(token?: ProviderToken<T>)
export function FromAngular<NextValue, T>(flags?: InjectOptions)
export function FromAngular<NextValue, T>(token?: ProviderToken<T>, flags?: InjectOptions)
export function FromAngular<NextValue, T>(token?: ProviderToken<T> | InjectOptions, flags: InjectOptions = {}) {
  if (!isProviderToken(token)) {
    flags = token as InjectOptions || {};
    token = undefined;
  }

  return Hook(
    function fromAngularHook(session: Session, __: NextInjectionHook<NextValue>): InjectionHookResult<T | null> {
      const angularInjector = session.context.injector.getSync(ANGULAR_INJECTOR);
      return angularInjector.get(token || session.inject.token as any, undefined, flags);
    },
    { name: 'adi:from-angular' }
  )
}
