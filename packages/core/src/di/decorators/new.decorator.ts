import { getInjectionArg } from "../definitions";
import { Scope } from "../scopes";

export function New<D = any>(ctxData?: D) {
  return function(target: Object, key: string | symbol, index?: number) {
    const arg = getInjectionArg(target, key, index);
    arg.options.scope = Scope.TRANSIENT;
    arg.options.scopeParams = ctxData;
  }
}
