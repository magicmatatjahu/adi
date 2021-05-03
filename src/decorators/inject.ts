import { Context } from "../injector";
import { ForwardRef } from "../interfaces";
import { Token } from "../types";
import { Reflection } from "../utils";
import { getInjectionArg } from "./injectable"; 

export function Inject<T = any>(token: Token<T> | ForwardRef<T>);
export function Inject<T = any>(ctx: Context);
export function Inject<T = any>(inject: false);
export function Inject<T = any>(token: Token<T> | ForwardRef<T>, ctx?: Context);
export function Inject<T = any>(token: Token<T> | Context | ForwardRef<T> | false, ctx?: Context) {
  if (token instanceof Context) {
    ctx = token;
    token = undefined;
  } 

  return function(target: Object, key: string | symbol, indexOrDescriptor?: number | PropertyDescriptor) {
    if (key !== undefined) {
      token = token || Reflection.getOwnMetadata("design:type", target, key);
    }

    const arg = getInjectionArg(target, key, indexOrDescriptor as any);
    arg.token = token as any;
    arg.options.ctx = ctx;
  }
}
