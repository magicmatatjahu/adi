import { Context } from "./injector";
import { ConstraintDef } from "./interfaces";
import { ANNOTATIONS } from "./constants";
import { Token } from "./types";

export function named(named: Token): ConstraintDef {
  return (session) => session.options?.labels[ANNOTATIONS.NAMED] === named;
}

export function withContext(ctx: Context): ConstraintDef {
  return (session) => session.options?.ctx === ctx;
}

export function labelled(l: Record<string | symbol | number, any>): ConstraintDef {
  const labelsLength = Object.keys(l).length;
  return (session) => {
    const labels = session.options?.labels;
    if (!labels) return false;
    let checks = 0;
    for (const label in labels) {
      if (labels[label] === l[label]) checks++;
    }
    return labelsLength === checks;
  }
}

export function and(...fns: Array<ConstraintDef>): ConstraintDef {
  return (session) => {
    for (let i = 0, l = fns.length; i < l; i++) {
      if (fns[i](session) === false) return false;
    }
    return true;
  }
}

export function or(...fns: Array<ConstraintDef>): ConstraintDef {
  return (session) => {
    for (let i = 0, l = fns.length; i < l; i++) {
      if (fns[i](session) === true) return true;
    }
    return false;
  }
}

export const when = {
  named,
  withContext,
  labelled,
  and,
  or,
}

export const NOOP_CONSTRAINT = () => true;
export const TRUE_CONSTRAINT = () => true;
export const FALSE_CONSTRAINT = () => false;
