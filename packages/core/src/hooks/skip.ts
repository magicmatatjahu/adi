import { Hook } from "./hook";

import type { InjectionHookResult } from '../types';

export function Skip() {
  return Hook(
    function skipHook(): InjectionHookResult<undefined> {
      return;
    },
    { name: 'adi:skip' }
  )
}
