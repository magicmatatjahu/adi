import { Scope, createScope } from "./scope";
import { STATIC_CONTEXT } from "../constants";

import type { Context, Session } from "../injector";
import type { ProviderInstance, DestroyContext } from "../interfaces";

export interface DefaultScopeOptions {}

export class DefaultScope extends Scope<DefaultScopeOptions> {
  override get name(): string {
    return "adi:scope:default";
  }

  override getContext(session: Session): Context {
    return session.injection.options.context || STATIC_CONTEXT;
  }

  override shouldDestroy(instance: ProviderInstance, _: DefaultScopeOptions, destroyCtx: DestroyContext): boolean {
    return destroyCtx.event === 'injector' && !instance.parents?.size;
  };
}

export default createScope<DefaultScopeOptions>(new DefaultScope(), { canBeOverrided: false });