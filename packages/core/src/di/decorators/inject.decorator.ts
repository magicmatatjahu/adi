import { InjectionFlags, DecoratorType } from "../enums";
import { getInjectionArg, mergeMethodParams } from "../definitions";
import { ForwardRef } from "../interfaces";
import { Context } from "../tokens";
import { Token } from "../types";
import { Reflection, getDecoratorType } from "../utils";

export function Inject<T = any>(token?: Token<T> | ForwardRef<T>);
export function Inject<T = any>(ctx?: Context);
export function Inject<T = any>(inject?: false);
export function Inject<T = any>(token?: Token<T> | ForwardRef<T>, ctx?: Context);
export function Inject<T = any>(token?: Token<T> | Context | ForwardRef<T> | false, ctx?: Context) {
  let flags = InjectionFlags.DEFAULT;
  if (token instanceof Context) {
    ctx = token;
    token = undefined;
  } else if (token === false) {
    flags = InjectionFlags.NO_INJECT;
  }

  return function(target: Object, key: string | symbol, indexOrDescriptor?: number | PropertyDescriptor) {
    const decoratorType = getDecoratorType(target, key, indexOrDescriptor);
    if (token === undefined) {
      if (decoratorType === DecoratorType.PROPERTY) {
        token = Reflection.getOwnMetadata("design:type", target, key);
      } else {
        const params = Reflection.getOwnMetadata("design:paramtypes", target, key);
        if (decoratorType === DecoratorType.METHOD_PARAMETER) {
          token = params[indexOrDescriptor as number];
        } else if (decoratorType === DecoratorType.METHOD) {
          mergeMethodParams(params, target, key as string);
          return;
        } else if (decoratorType === DecoratorType.SETTER_ACCESSOR) {
          token = params[0];
          // reset indexOrDescriptor value, because there is a descriptor
          indexOrDescriptor = undefined;
        }
      }
    } else if (decoratorType === DecoratorType.SETTER_ACCESSOR) {
      // setter injection - reset indexOrDescriptor value
      indexOrDescriptor = undefined;
    } else if (decoratorType === DecoratorType.METHOD) {
      // throw error when user pass arguments to decorator on wrapping method
      throw Error("Cannot pass arguments to decorator on wrapping method");
    }

    const arg = getInjectionArg(target, key, indexOrDescriptor as any);
    arg.token = token as any;
    arg.options.ctx = ctx;
    arg.options.flags |= flags;
  }
}

// if (token === undefined) {
//   if (key !== undefined) {
//     if (indexOrDescriptor === undefined) {
//       // property
//       token = Reflection.getOwnMetadata("design:type", target, key);
//     } else {
//       const deps = Reflection.getOwnMetadata("design:paramtypes", target, key);
//       if (typeof indexOrDescriptor === "number") {
//         // method parameter
//         token = deps[indexOrDescriptor];
//       } else if (indexOrDescriptor.set !== undefined) {
//         // setter injection - infer type
//         token = deps[0];
//         // reset indexOrDescriptor value, because here is a descriptor
//         indexOrDescriptor = undefined;
//       } else {
//         // whole method
//         mergeMethodParams(deps, target, key as string);
//         return;
//       }
//     }
//   }
// } else {
//   if (typeof indexOrDescriptor === "object") {
//     if (indexOrDescriptor.set !== undefined) {
//       // setter injection - reset indexOrDescriptor value
//       indexOrDescriptor = undefined;
//     } else {
//       // throw error when user pass arguments to decorator on wrapping method
//       throw Error("Cannot pass arguments to decorator on wrapping method");
//     }
//   }
// }