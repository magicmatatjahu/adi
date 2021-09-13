import { Context, Session } from "../injector";
import { STATIC_CONTEXT } from "../constants";
import { ScopeFlags } from "../enums";

import { Scope } from "./index";
import { DestroyEvent, InstanceRecord } from "../interfaces";

export interface RequestScopeOptions {
  reuseContext?: boolean;
}

const defaultOptions: RequestScopeOptions = {
  reuseContext: true,
}

export class RequestScope extends Scope<RequestScopeOptions> {
  public readonly flags: ScopeFlags = ScopeFlags.CANNOT_OVERRIDE;

  get name() {
    return 'Request';
  }

  public getContext(session: Session): Context {
    const ctx = session.getContext();
    if (ctx && ctx !== STATIC_CONTEXT) {
      throw new Error("Cannot create provider with singleton scope");
    }
    return STATIC_CONTEXT;
  }

  public canDestroy(): boolean {
    // always destroy
    return true;
  };
}
