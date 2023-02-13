import { ADI_HOOK_DEF } from "../private";

import type { Session } from "../injector";
import type { InjectionHook, InjectionHookOptions, InjectionHookFn, NextInjectionHook } from "../interfaces";

type ReturnHookFnType<F> = F extends (...args: any) => InjectionHookFn<infer T> ? T : unknown; 
type ReturnHookType<F> = F extends InjectionHook<infer T> ? T : unknown;

// type GenericReturnType<T extends (result: any) => unknown> = T;
// type LOL = GenericReturnType<<T>(arg: T) => Destroyable<T>>;
// type InferGenericType<T> = T extends GenericReturnType<infer F> ? ReturnType<F> : unknown;

// type Test = InferGenericType<GenericReturnType<<T>(arg: T) => Destroyable<T>>>;

// type Destroyable<T> = {
//   value: T;
//   destroy: () => void;
// }

export function createHook<F extends (...args: any) => InjectionHookFn>(hook: F, options?: InjectionHookOptions): (...args: Parameters<F>) => InjectionHook<ReturnHookFnType<F>> {
  hook[ADI_HOOK_DEF] = options || true;
  return (...args: Parameters<F>) => {
    const fn = hook(...args as any);
    fn[ADI_HOOK_DEF] = options || true;
    return fn as InjectionHook<ReturnHookFnType<F>>;
  }
}

export const Hook = createHook((hook: InjectionHookFn) => {
  return hook;
}, { name: 'adi:hook:hook' });

export function isHook(hooks: unknown): hooks is InjectionHook | Array<InjectionHook> {
  if (!hooks) return false;
  return Array.isArray(hooks) ? hooks[0]?.[ADI_HOOK_DEF] : hooks[ADI_HOOK_DEF];
}

export function runHooks(hooks: Array<InjectionHook>, session: Session, lastHook: NextInjectionHook) {
  if (hooks.length === 0) return lastHook(session);
  return internalRunHooks([...hooks, lastHook as unknown as InjectionHook], session, -1);
}

function internalRunHooks(hooks: Array<InjectionHook>, session: Session, index: number) {
  return hooks[++index](session, (s: Session) => internalRunHooks(hooks, s, index));
}
