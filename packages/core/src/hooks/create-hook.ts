import { ADI_HOOK_DEF } from "../private";

import type { InjectionHook, InjectionHookFunction, InjectionHookOptions } from '../types';

export function createHook<T, R, HF extends (...args: any[]) => InjectionHookFunction<T, R>>(hook: HF, options?: InjectionHookOptions): (...args: Parameters<HF>) => InjectionHook<T, R> {
  return (...args: Parameters<HF>) => {
    const fn = hook(...args) as InjectionHook<T, R>;
    fn[ADI_HOOK_DEF] = { options };
    return fn;
  }
}
