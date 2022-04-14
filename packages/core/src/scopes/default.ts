import { Scope, createScope } from "./scope";
import { STATIC_CONTEXT } from "../constants";

import type { Context, Session, DestroyContext } from "../injector";
import type { ProviderInstance } from "../interfaces";

export interface DefaultScopeOptions {}

export class DefaultScope extends Scope<DefaultScopeOptions> {
  override get name(): string {
    return "adi:scope:default";
  }

  override getContext(session: Session): Context {
    return session.options.ctx || STATIC_CONTEXT;
  }

  override canDestroy(instance: ProviderInstance, _: DefaultScopeOptions, ctx: DestroyContext): boolean {
    if (ctx.event === 'injector') return true;
    return instance.parents === undefined || instance.parents.size === 0;
  };
}

export default createScope<DefaultScopeOptions>(new DefaultScope(), { canBeOverrided: false });