import { ADI_HOOK_DEF } from '../private';

import type { Session } from '../injector/session';
import type { InjectionHookKind } from '../enums';

export type InjectionHookResult<T> = T | Promise<T>

export type NextInjectionHook<T = any> = (session: Session) => InjectionHookResult<T>;

export interface InjectionHookContext {
  kind: InjectionHookKind;
}

export interface InjectionHookOptions {
  name: string;
}

export interface InjectionHookDefinition {
  options?: InjectionHookOptions;
}

export interface InjectionHookFunction<T = unknown, R = unknown>{
  (session: Session, next: NextInjectionHook<T>, ctx: InjectionHookContext): InjectionHookResult<R>;
}

export interface InjectionHook<T = unknown, R = unknown> extends InjectionHookFunction<T, R> {
  [ADI_HOOK_DEF]: InjectionHookDefinition;
}
