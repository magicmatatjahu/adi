import { Context, Session } from "../injector";
import { DestroyEvent, InstanceRecord } from "../interfaces";
import { STATIC_CONTEXT } from "../constants";

import { Scope } from "./index";

export class DefaultScope extends Scope<never> {
  get name() {
    return 'Default';
  }

  public getContext(session: Session): Context {
    return session.getContext() || STATIC_CONTEXT;
  }

  public onDestroy(event: DestroyEvent, instance: InstanceRecord): boolean {
    // destroy only on `injector` event and when parents don't exist 
    return event === 'injector' && (instance.parents === undefined || instance.parents.size === 0);
  };
}
