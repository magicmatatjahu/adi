import { getHostInjector } from "./injector/metadata";
import { treeInjectorMetaKey, exportedToInjectorsMetaKey } from './private';

import type { Context, Injector, Session } from "./injector";
import type { InjectionAnnotations, ConstraintDefinition } from "./types";

export function named(name: InjectionAnnotations['named']): ConstraintDefinition {
  return (session) => {
    const { inject, metadata } = session.injection;
    return name === (inject.annotations.named || metadata.annotations?.named);
  }
}

export function tagged(tags: InjectionAnnotations['tagged'] = [], mode: 'all' | 'partially' = 'all'): ConstraintDefinition {
  function includeTag(tag: string | symbol | object) {
    tags.includes(tag);
  }

  return (session) => {
    const { inject, metadata } = session.injection;
    const alltags = [...metadata.annotations?.tagged || [], ...inject.annotations.tagged || []];
    return mode == 'all' ? alltags.every(includeTag) : alltags.some(includeTag);
  }
}

export function context(ctx: Context): ConstraintDefinition {
  return (session) => session.inject.context === ctx;
}

export function visible(type: 'public' | 'private'): ConstraintDefinition {
  return (session) => {
    switch(type) {
      case 'private': {
        return getHostInjector(session) === session.context.injector;
      }
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

export function not(constraint: ConstraintDefinition): ConstraintDefinition {
  return (session) => !constraint(session);
}

export function always(): boolean {
  return true;
}

export function never(): boolean {
  return false;
}

/**
 * private constraints
 **/
export function whenExported(session: Session): boolean {
  const { provider, definition } = session.context;
  const exportedTo = provider?.meta[exportedToInjectorsMetaKey] as WeakMap<Injector, any[] | true>;
  if (exportedTo) {
    const treeInjector = session.meta[treeInjectorMetaKey];
    const names = exportedTo.get(treeInjector);
    if (Array.isArray(names)) {
      return names.includes(definition?.name);
    }
  }
  return true;
}

export function whenComponent(session: Session): boolean {
  return Boolean(session.parent || getHostInjector(session) !== session.context.injector) === false;
}

export const when = {
  named,
  tagged,
  context,
  visible,
  and,
  or,
  not,
  always,
  never,
}
