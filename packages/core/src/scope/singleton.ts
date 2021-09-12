import { Context, Session } from "../injector";
import { STATIC_CONTEXT } from "../constants";
import { ScopeFlags } from "../enums";

import { Scope } from "./index";
import { DestroyEvent, InstanceRecord } from "../interfaces";

export interface SingletonScopeOptions {
  reuseContext?: boolean;
}

const defaultOptions: SingletonScopeOptions = {
  reuseContext: true,
}

export class SingletonScope extends Scope<SingletonScopeOptions> {
  public readonly flags: ScopeFlags = ScopeFlags.CANNOT_OVERRIDE;

  get name() {
    return 'Singleton';
  }

  public getContext(session: Session): Context {
    const ctx = session.getContext();
    if (ctx && ctx !== STATIC_CONTEXT) {
      throw new Error("Cannot create provider with singleton scope");
    }
    return STATIC_CONTEXT;
  }

  public onDestroy(event: DestroyEvent, instance: InstanceRecord): boolean {
    // destroy only on `injector` event and when parents don't exist 
    return event === 'injector' && (instance.parents === undefined || instance.parents.size === 0);
  };
}
