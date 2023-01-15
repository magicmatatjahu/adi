import { getHostInjector } from "./injector/metadata";

import type { Context } from "./injector";
import type { InjectionAnnotations, ConstraintDefinition } from "./interfaces";

export function named(name: InjectionAnnotations['named']): ConstraintDefinition {
  return (session) => {
    const { metadata, options } = session.injection;
    return name === (options.annotations.named || metadata.annotations.named);
  }
}

export function tagged(tags: InjectionAnnotations['tagged'] = [], mode: 'all' | 'partially' = 'all'): ConstraintDefinition {
  const includeTag = (tag: string) => tags.includes(tag);
  return (session) => {
    const { metadata, options } = session.injection;
    const alltags = [...metadata.annotations.tagged || [], ...options.annotations.tagged];
    return mode == 'all' ? alltags.every(includeTag) : alltags.some(includeTag);
  }
}

export function context(ctx: Context): ConstraintDefinition {
  return (session) => session.iOptions.context === ctx;
}

export function visible(type: 'public' | 'private'): ConstraintDefinition {
  return (session) => {
    if (type === 'private') {
      return getHostInjector(session) === session.context.injector;
    };
    return true;
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