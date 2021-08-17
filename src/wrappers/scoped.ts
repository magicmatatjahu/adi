import { ScopeShape, ScopeType, WrapperDef } from "../interfaces";
import { Scope } from "../scope";
import { createWrapper } from "../utils";

interface ScopedOptions {
  reuseParentScope: true;
}

function wrapper(scope: Scope | ScopeType | ScopedOptions): WrapperDef {
  let options: any;
  let reuseParentScope: boolean = false;
  if ((scope as ScopeShape).which !== undefined) {
    options = (scope as ScopeShape).options;
    scope = (scope as ScopeShape).which;
  } else if ((scope as ScopedOptions).reuseParentScope === true) {
    reuseParentScope = true;
  }
  return (injector, session, next) => {
    if (reuseParentScope === true) {
      const parent = session.parent;
      const def = parent.definition;
      const options = parent.options;

      let reusedScope = def.scope;
      if (reusedScope.which.canBeOverrided() === true) {
        reusedScope = options.scope.which ? options.scope : reusedScope;
      }
      session.setScope(reusedScope.which, reusedScope.options);
    } else {
      session.setScope(scope as Scope, options);
    }
    return next(injector, session);
  }
}

export const Scoped = createWrapper<ScopeType, true>(wrapper);
