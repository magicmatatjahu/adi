
import { ConstraintDef, InjectionSession } from "./interfaces";
import { CONSTRAINTS } from "./constants";
import { Token } from "./types";

export function named(named: Token): ConstraintDef {
  return (session: InjectionSession) => session.options?.labels[CONSTRAINTS.NAMED] === named;
}

export function labels(l: Record<string | symbol | number, any> = {}): ConstraintDef {
  const tagsLength = Object.keys(l).length;
  return (session: InjectionSession) => {
    const labels = session.options?.labels;
    if (!labels) return false;
    let checks = 0;
    for (const label in labels) {
      if (labels[label] === l[label]) checks++;
    }
    return tagsLength === checks;
  }
}

export function withoutLabels(): ConstraintDef {
  return (session: InjectionSession) => Object.keys(session.options.labels).length === 0;
}

export function concat(...fns: Array<ConstraintDef>): ConstraintDef {
  return (session: InjectionSession) => {
    for (let i = 0, l = fns.length; i < l; i++) {
      if (fns[i](session) === false) return false;
    }
    return true;
  }
}

export const constraint = {
  withoutLabels,
  named,
  labels,
  concat,
}
export const c = constraint;

export const NOOP_CONSTRAINT = () => true;
export const TRUE_CONSTRAINT = () => true;
export const FALSE_CONSTRAINT = () => false;
