import { getHostInjector } from "./utils";

import type { Context } from "./injector";
import type { ConstraintDefinition } from "./interfaces";

export function named(named: string): ConstraintDefinition {
  return (session) => 
    session.metadata.annotations['adi:named'] === named ||
    session.options.annotations['adi:named'] === named;
}

export function tagged(tags: Array<string> = []): ConstraintDefinition {
  const everyTags = (tag: string) => tags.includes(tag);
  return (session) =>
    (session.metadata.annotations["adi:tagged"] || []).every(everyTags) ||
    (session.options.annotations["adi:tagged"] || []).every(everyTags)
}

export function context(ctx: Context): ConstraintDefinition {
  return (session) => session.options.ctx === ctx;
}

export function visible(type: 'public' | 'private'): ConstraintDefinition {
  return (session) => {
    switch (type) {
      case 'private': {
        return getHostInjector(session) === session.ctx.injector;
      };
      // case 'close': {
      //   const host = getHostInjector(session);
      //   const injector = session.ctx.injector;
      //   if (host === injector) return true;
      //   if (host.imports.has(injector.metatype as any)) return true;
      //   return false;
      // }
      // public and other cases
      default: return true;
    }
  }
}

export function and(...fns: Array<ConstraintDefinition>): ConstraintDefinition {
  return (session) => {
    for (let i = 0, l = fns.length; i < l; i++) {
      if (fns[i](session) === false) return false;
    }
    return true;
  }
}

export function or(...fns: Array<ConstraintDefinition>): ConstraintDefinition {
  return (session) => {
    for (let i = 0, l = fns.length; i < l; i++) {
      if (fns[i](session) === true) return true;
    }
    return false;
  }
}

export const ALWAYS_CONSTRAINT: ConstraintDefinition = () => true;

export const when = {
  named,
  tagged,
  context,
  visible,
  and,
  or,
}