import { ConstraintFunction, InjectionContext } from "../interfaces";
import { CONSTRAINTS } from "../constants";
import { Token } from "../types";

export function withoutAttrs(): ConstraintFunction {
  return (ctx: InjectionContext) => Object.keys(ctx.attrs).length === 0;
}

export function named(named: Token): ConstraintFunction {
  return (ctx: InjectionContext) => ctx.attrs[CONSTRAINTS.NAMED] === named;
}

export function tagged(tags: Record<string | symbol | number, any>): ConstraintFunction {
  const tagsKeysLength = Object.keys(tags || {}).length;
  return (ctx: InjectionContext) => {
    const attrs = ctx.attrs;
    let checks = 0;
    Object.keys(attrs).forEach(key => {
      if (attrs[key] === tags[key]) checks++;
    });
    return tagsKeysLength === checks;
  }
}

export function concatConstraints(...fns: Array<ConstraintFunction>): ConstraintFunction {
  return (ctx: InjectionContext) => {
    for (let i = 0, l = fns.length; i < l; i++) {
      if (fns[i](ctx) === false) return false;
    }
    return true;
  }
}

export function constraintNoop() {
  return true;
}

export const c = {
  withoutAttrs,
  named,
  tagged,
  concat: concatConstraints,
}