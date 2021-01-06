import { getInjectionArg } from "../definitions";
import { InjectionFlags, DecoratorType } from "../enums";
import { getDecoratorType } from "../utils";

export function Lazy() {
  return function(target: Object, key: string | symbol, descriptor?: PropertyDescriptor) {
    if (getDecoratorType(target, key, descriptor) !== DecoratorType.PROPERTY) {
      throw Error("Lazy injection works only in property injection (also not in setter)");
    }
    const arg = getInjectionArg(target, key);
    arg.options.flags |= InjectionFlags.LAZY;
  }
}
