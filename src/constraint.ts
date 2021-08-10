import { Context } from "./injector";
import { ConstraintDef } from "./interfaces";
import { CONSTRAINTS } from "./constants";
import { Token } from "./types";

export function named(named: Token): ConstraintDef {
  return (session) => session.options?.labels[CONSTRAINTS.NAMED] === named;
}

export function ctx(ctx: Context): ConstraintDef {
  return (session) => session.options?.ctx === ctx;
}

export function labelled(l: Record<string | symbol | number, any> = {}): ConstraintDef {
  const tagsLength = Object.keys(l).length;
  return (session) => {
    const labels = session.options?.labels;
    if (!labels) return false;
    let checks = 0;
    for (const label in labels) {
      if (labels[label] === l[label]) checks++;
    }
    return tagsLength === checks;
  }
}

export function concat(...fns: Array<ConstraintDef>): ConstraintDef {
  return (session) => {
    for (let i = 0, l = fns.length; i < l; i++) {
      if (fns[i](session) === false) return false;
    }
    return true;
  }
}

export const constraint = {
  named,
  labelled,
  concat,
}
export const c = constraint;

export const NOOP_CONSTRAINT = () => true;
export const TRUE_CONSTRAINT = () => true;
export const FALSE_CONSTRAINT = () => false;
