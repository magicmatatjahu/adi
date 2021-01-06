import { getInjectionArg } from "../definitions";
import { InjectionFlags } from "../enums";

export function SkipSelf() {
  return function(target: Object, key: string | symbol, index?: number) {
    const arg = getInjectionArg(target, key, index);
    arg.options.flags |= InjectionFlags.SKIP_SELF;
  }
}
