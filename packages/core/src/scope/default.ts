import { Context, Session } from "../injector";
import { DestroyEvent, InstanceRecord } from "../interfaces";
import { STATIC_CONTEXT } from "../constants";

import { Scope } from "./index";

export interface DefaultScopeOptions {}

export class DefaultScope extends Scope<DefaultScopeOptions> {
  get name() {
    return 'Default';
  }

  public getContext(session: Session): Context {
    return session.getContext() || STATIC_CONTEXT;
  }

  public canDestroy(event: DestroyEvent, instance: InstanceRecord): boolean {
    // destroy only on `injector` event and when parents don't exist 
    return event === 'injector' && (instance.parents === undefined || instance.parents.size === 0);
  };
}
