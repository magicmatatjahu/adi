import { applyInjectionArg } from "./injectable"; 
import { Token } from "../types";
import { Reflection, isWrapper } from "../utils";
import { Wrapper } from "../utils/wrappers";
import { Annotations } from "../interfaces";
import { InjectionToken } from "../injector";

export function Inject<T = any>(token?: Token<T>);
export function Inject<T = any>(wrapper?: Wrapper | Array<Wrapper>);
export function Inject<T = any>(annotations?: Annotations);
export function Inject<T = any>(token?: Token<T>, annotations?: Annotations);
export function Inject<T = any>(wrapper?: Wrapper | Array<Wrapper>, annotations?: Annotations);
export function Inject<T = any>(token?: Token<T>, wrapper?: Wrapper | Array<Wrapper>, annotations?: Annotations);
export function Inject<T = any>(token?: Token<T> | Wrapper | Array<Wrapper> | Annotations, wrapper?: Wrapper | Array<Wrapper> | Annotations, annotations?: Annotations) {
  if (typeof token === 'object' && !(token instanceof InjectionToken)) { // case with one argument
    if (isWrapper(token)) { // single wrapper of array of wrappers
      annotations = wrapper as Annotations;
      wrapper = token;
    } else {
      annotations = token as Annotations;
    }
    token = undefined;
  } else if (typeof wrapper === 'object' && !isWrapper(wrapper)) { // case with two arguments argument
    annotations = wrapper as Annotations;
    wrapper = undefined;
  }

  return function(target: Object, key: string | symbol, indexOrDescriptor?: number | PropertyDescriptor) {
    let handler: Function | undefined;
    if (token === undefined) {
      if (key === undefined) { // constructor injection
        token = Reflection.getOwnMetadata("design:paramtypes", target)[indexOrDescriptor as number];
      } else {
        if (indexOrDescriptor === undefined) { // property injection
          token = Reflection.getOwnMetadata("design:type", target, key);
        } else if (typeof indexOrDescriptor === 'number') { // method injection
          token = Reflection.getOwnMetadata("design:paramtypes", target, key)[indexOrDescriptor];
          handler = Object.getOwnPropertyDescriptor(target, key).value;
        } else if (typeof indexOrDescriptor.value === 'function') { // whole method injection
          const paramtypes = Reflection.getOwnMetadata("design:paramtypes", target, key);
          handler = indexOrDescriptor.value;
          for (let i = 0, l = paramtypes.length; i < l; i++) {
            // TODO: test passing `useWrapper` from `@Inject` decorator on method
            const arg = applyInjectionArg(paramtypes[i], wrapper as Wrapper | Array<Wrapper>, annotations, target, key, i, handler);
            arg.token = arg.token || paramtypes[i];
          }
          return;
        } else { // setter injection
          token = Reflection.getOwnMetadata("design:type", target, key);
          handler = indexOrDescriptor.value;
          indexOrDescriptor = undefined;
        }
      }
    }
    applyInjectionArg(token as Token, wrapper as Wrapper | Array<Wrapper>, annotations, target, key, indexOrDescriptor, handler);
  }
}
