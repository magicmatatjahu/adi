import { Scope, createScope } from "./scope";
import { STATIC_CONTEXT } from "../constants";
// import { DestroyEvent, InstanceRecord } from "../interfaces";

import type { Context, Session } from "../injector";

export interface DefaultScopeOptions {}

export class DefaultScope extends Scope<DefaultScopeOptions> {
  override get name(): string {
    return "adi:scope:default";
  }

  override getContext(session: Session): Context {
    return session.options.ctx || STATIC_CONTEXT;
  }

  // public canDestroy(event: DestroyEvent, instance: InstanceRecord): boolean {
  //   // destroy only on `injector` event and when parents don't exist 
  //   return event === 'injector' && (instance.parents === undefined || instance.parents.size === 0);
  // };
}

export default createScope<DefaultScopeOptions>(new DefaultScope(), {});