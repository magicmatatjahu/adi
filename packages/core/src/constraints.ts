import { getHostInjector } from "./injector/metadata";

import type { Context } from "./injector";
import type { ConstraintDefinition } from "./interfaces";

export function named(named: string | symbol, strict: boolean = true): ConstraintDefinition {
  return (session) => {
    const name = session.metadata.annotations['adi:named'] || session.options.annotations['adi:named'];
    const condition = named === name;
    if (strict === false) {
      const typeOf = typeof name;
      return condition && (typeOf === 'string' || typeOf === 'symbol');
    }
    return condition;
  }
}

export function tagged(tags: Array<string | symbol> = [], strict: boolean = true): ConstraintDefinition {
  const includeTags = (tag: string) => tags.includes(tag);
  return (session) => {
    const metaTags = session.metadata.annotations["adi:tagged"] || [];
    const optionsTags = session.options.annotations["adi:tagged"] || [];
    const alltags = [...metaTags as any[], ...optionsTags as any[]]; // fix that
    if (strict === false && alltags.length === 0) {
      return true;
    }
    return alltags.every(includeTags);
  }
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

export function and(...constraints: Array<ConstraintDefinition>): ConstraintDefinition {
  return (session) => constraints.every(constraint => constraint(session));
}

export function or(...constraints: Array<ConstraintDefinition>): ConstraintDefinition {
  return (session) => constraints.some(constraint => constraint(session));
}

export function always() {
  return true;
}

export function never() {
  return false;
}

export const when = {
  named,
  tagged,
  context,
  visible,
  and,
  or,
  always,
  never,
}