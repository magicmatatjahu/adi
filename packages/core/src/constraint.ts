import { Context } from "./injector";
import { ConstraintDef } from "./interfaces";
import { ANNOTATIONS } from "./constants";
import { Token } from "./types";

export function named(named: Token): ConstraintDef {
  return (session) => 
    session.options?.annotations[ANNOTATIONS.NAMED] === named ||
    session.metadata.annotations?.[ANNOTATIONS.NAMED] === named;
}

// TODO: rename to `context`
export function withContext(ctx: Context): ConstraintDef {
  return (session) => session.options?.ctx === ctx;
}

export function annotated(l: Record<string | symbol | number, any>): ConstraintDef {
  const annotationsLength = Object.keys(l).length;
  return (session) => {
    const annotations = session.options?.annotations;
    if (!annotations) return false;
    let checks = 0;
    for (const annotation in annotations) {
      if (annotations[annotation] === l[annotation]) checks++;
    }
    return annotationsLength === checks;
  }
}

export function visible(type: 'public' | 'protected' | 'private'): ConstraintDef {
  return (session) => {
    switch (type) {
      case 'private': {
        return session.getHost() === session.injector
      };
      case 'protected': {
        const host = session.getHost();
        if (host === session.injector) return true;
        if (host.imports.has(session.injector.metatype as any)) return true;
        return false;
      }
      // public and other cases
      default: return true;
    }
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
  annotated,
  visible,
  and,
  or,
}

export const NOOP_CONSTRAINT = () => true;
export const TRUE_CONSTRAINT = () => true;
export const FALSE_CONSTRAINT = () => false;
