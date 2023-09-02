import { ADI_HOOK_DEF } from "../private";

import type { InjectionHook, InjectionHookFunction, InjectionHookOptions } from '../types';

export function Hook<T, R>(hookFunction: InjectionHookFunction<T, R>, options?: InjectionHookOptions): InjectionHook<T, R> {
  hookFunction[ADI_HOOK_DEF] = { options };
  return hookFunction as InjectionHook<T, R>;
}
