import { getInjectionArg } from "../definitions";
import { CONSTRAINTS } from "../constants";
import { Token } from "../types";
import { assign } from "../utils";

export function Named(name: Token) {
  return function(target: Object, key: string | symbol, index?: number) {
    const arg = getInjectionArg(target, key, index);
    arg.options.attrs[CONSTRAINTS.NAMED] = name;
  }
}

export function Tagged<K extends string | symbol | number, V = any>(key: K, value: V);
export function Tagged<K extends string | symbol | number, V = any>(records: Record<K, V>);
export function Tagged<K extends string | symbol | number, V = any>(recordsOrKey: Record<K, V> | K, value?: V) {
  const attrs = typeof recordsOrKey === "object" ? recordsOrKey : { [recordsOrKey]: value };
  return function(target: Object, key: string | symbol, index?: number) {
    const arg = getInjectionArg(target, key, index);
    arg.options.attrs = assign({}, arg.options.attrs, attrs);
  }
}
