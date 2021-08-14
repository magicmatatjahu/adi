import { Context, Injector, Session } from "../injector";
import { STATIC_CONTEXT } from "../constants";

import { Scope } from "./index";

export class ParentScope extends Scope {
  get name() {
    return 'Parent';
  }

  // TODO: It should skip the Transient scope like in DryIoc? -> ref: https://github.com/dadhi/DryIoc/blob/master/docs/DryIoc.Docs/ReuseAndScopes.md#setupuseparentreuse
  public getContext(session: Session, injector: Injector, options: any): Context {
    const parent = session.getParent();
    if (parent === undefined) {
      return STATIC_CONTEXT;
    }

    let scope = parent.definition.scope;
    if (scope.canBeOverrided() === true) {
      scope = parent.options.scope || scope;
    }
    return scope.getContext(session, injector, options);
  }
}
