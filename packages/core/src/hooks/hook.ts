import { createHook } from "./create-hook";

import type { InjectionHookFunction } from '../types';

export const Hook = createHook(<T, R>(hook: InjectionHookFunction<T, R>) => {
  return hook;
}, { name: 'adi:hook:hook' });
