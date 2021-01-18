import { WhenFunction, InjectionContext } from "../interfaces";
import { CONSTRAINTS } from "../constants";
import { Token } from "../types";

export function named(named: Token): WhenFunction {
  return (ctx: InjectionContext) => ctx.metadata[CONSTRAINTS.NAMED] === named;
}

export function tagged(tags: Record<string | symbol | number, any>): WhenFunction {
  const tagsKeysLength = Object.keys(tags || {}).length;
  return (ctx: InjectionContext) => {
    const metadata = ctx.metadata;
    let checks = 0;
    Object.keys(metadata).forEach(key => {
      if (metadata[key] === tags[key]) checks++;
    });
    return tagsKeysLength === checks;
  }
}

export function concatConstraints(...fns: Array<WhenFunction>): WhenFunction {
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
