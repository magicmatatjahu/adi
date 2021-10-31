import { Context, Session } from "../injector";
import { ScopeFlags } from "../enums";

import { Scope } from "./index";

export interface RequestScopeOptions {
  reuseContext?: boolean;
}

const defaultOptions: RequestScopeOptions = {
  reuseContext: true,
}

const obj = { request: true };

export class RequestScope extends Scope<RequestScopeOptions> {
  public readonly flags: ScopeFlags = ScopeFlags.CANNOT_OVERRIDE;

  get name() {
    return 'Request';
  }

  public getContext(session: Session, options: RequestScopeOptions = defaultOptions): Context {
    this.applyProxy(session);
    // return placeholder context
    return new Context();
  }

  public create(
    session: Session,
    options: RequestScopeOptions,
  ) {
    return obj;
  }

  public canDestroy(): boolean {
    // always destroy
    return true;
  };

  private applyProxy(session: Session) {
    let parent = session.parent;
    while (parent) {
      const def = parent.definition;
      if (def) {
        const proxies = def.meta.proxyInstances = def.meta.proxyInstances || {};
        proxies.request = {
          obj: obj,
          factory: () => session.definition.factory(session.injector, session),
        };
      }
      parent = parent.parent;
    }
  }
}
