import { ConstraintFunction, InjectionOptions } from "../interfaces";
import { CONSTRAINTS } from "../constants";
import { Token } from "../types";

export function withoutAttrs(): ConstraintFunction {
  return (opts: InjectionOptions) => Object.keys(opts.attrs).length === 0;
}

export function named(named: Token): ConstraintFunction {
  return (opts: InjectionOptions) => opts.attrs && opts.attrs[CONSTRAINTS.NAMED] === named;
}

export function tagged(tags: Record<string | symbol | number, any>): ConstraintFunction {
  const tagsKeysLength = Object.keys(tags || {}).length;
  return (opts: InjectionOptions) => {
    const attrs = opts.attrs;
    let checks = 0;
    Object.keys(attrs).forEach(key => {
      if (attrs[key] === tags[key]) checks++;
    });
    return tagsKeysLength === checks;
  }
}

export function concatConstraints(...fns: Array<ConstraintFunction>): ConstraintFunction {
  return (opts: InjectionOptions) => {
    for (let i = 0, l = fns.length; i < l; i++) {
      if (fns[i](opts) === false) return false;
    }
    return true;
  }
}

export function constraintNoop() {
  return true;
}

export function always() {
  return true;
}

export const c = {
  withoutAttrs,
  named,
  tagged,
  concat: concatConstraints,
  always,
}