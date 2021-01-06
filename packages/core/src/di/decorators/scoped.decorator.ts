import { getInjectionArg } from "../definitions";
import { Scope } from "../scopes";

export function Scoped<D = any>(scope: Scope, scopeParams: D) {
  return function(target: Object, key: string | symbol, index?: number) {
    const arg = getInjectionArg(target, key, index);
    arg.options.scope = scope;
    arg.options.scopeParams = scopeParams;
  }
}
