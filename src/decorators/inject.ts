import { applyInjectionArg } from "./injectable"; 
import { Token } from "../types";
import { Reflection, isWrapper } from "../utils";
import { Wrapper } from "../utils/wrappers";

export function Inject<T = any>(token?: Token<T>, wrapper?: Wrapper);
export function Inject<T = any>(wrapper?: Wrapper);
export function Inject<T = any>(token?: Token<T> | Wrapper, wrapper?: Wrapper) {
  if (isWrapper(token)) {
    wrapper = token as Wrapper;
    token = undefined;
  }

  return function(target: Object, key: string | symbol, index?: number | PropertyDescriptor) {
    if (token === undefined) {
      if (key === undefined) { // constructor injection
        token = Reflection.getOwnMetadata("design:paramtypes", target)[index as number];
      } else {
        if (index === undefined) { // property injection
          token = Reflection.getOwnMetadata("design:type", target, key);
        } else if (typeof index === 'number') { // method injection
          token = Reflection.getOwnMetadata("design:paramtypes", target, key)[index];
        } else if (typeof index.value === 'function') { // whole method injection
          const paramtypes = Reflection.getOwnMetadata("design:paramtypes", target, key);
          for (let i = 0, l = paramtypes.length; i < l; i++) {
            // TODO: test passing `useWrapper` from main `@Injector` decorator on method
            const arg = applyInjectionArg(paramtypes[i], wrapper, target, key, i);
            arg.token = arg.token || paramtypes[i];
            arg.options.token = arg.token;
          }
          return;
        } else { // setter injection
          token = Reflection.getOwnMetadata("design:type", target, key);
        }
      }
    }
    applyInjectionArg(token as Token, wrapper, target, key, index);
  }
}
