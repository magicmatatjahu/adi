
import { Context } from "../injector";
import { createScope } from "./factory";
import { Scope } from "./scope";

import type { Session, ProviderInstance } from "../injector";
import type { DestroyContext } from "../types";

export interface DefaultScopeOptions {}

export class DefaultScope extends Scope<DefaultScopeOptions> {
  override get name(): string {
    return "adi:scope:default";
  }

  override getContext(session: Session): Context {
    return session.ctx || Context.STATIC;
  }

  override shouldDestroy(instance: ProviderInstance, _: DefaultScopeOptions, destroyCtx: DestroyContext): boolean {
    return destroyCtx.event === 'injector' && !instance.parents?.size;
  };
}

export default createScope<DefaultScopeOptions>(new DefaultScope(), { canBeOverrided: false });
