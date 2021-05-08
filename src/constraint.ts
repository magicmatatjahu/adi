
import { ConstraintDef, InjectionSession } from "./interfaces";
import { CONSTRAINTS } from "./constants";
import { Token } from "./types";

export function named(named: Token): ConstraintDef {
  return (session: InjectionSession) => session.options?.attrs[CONSTRAINTS.NAMED] === named;
}

export function tagged(tags: Record<string | symbol | number, any> = {}): ConstraintDef {
  const tagsLength = Object.keys(tags).length;
  return (session: InjectionSession) => {
    const attrs = session.options?.attrs;
    if (!attrs) return false;
    let checks = 0;
    for (const attr in attrs) {
      if (attrs[attr] === tags[attr]) checks++;
    }
    return tagsLength === checks;
  }
}

export function withoutAttrs(): ConstraintDef {
  return (session: InjectionSession) => Object.keys(session.options.attrs).length === 0;
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
  withoutAttrs,
  named,
  tagged,
  concat,
}
export const c = constraint;

export const NOOP_CONSTRAINT = () => true;
export const TRUE_CONSTRAINT = () => true;
export const FALSE_CONSTRAINT = () => false;
