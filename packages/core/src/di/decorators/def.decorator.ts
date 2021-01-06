import { getInjectionArg } from "../definitions";
import { Token } from "../types";

export function Def(def: Token) {
  return function(target: Object, key: string | symbol, index?: number) {
    const arg = getInjectionArg(target, key, index);
    arg.options.def = def;
  }
}
