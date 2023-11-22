import { treeInjectorMetaKey, exportedToInjectorsMetaKey } from './private';

import type { Context, Injector, Session } from "./injector";
import type { InjectionAnnotations, ConstraintDefinition } from "./types";

export function named(name: InjectionAnnotations['named']): ConstraintDefinition {
  return (session) => {
    return name === session.annotations.named;
  }
}

export function tagged(tags: InjectionAnnotations['tagged'] = [], options?: { mode: 'all' | 'partially' }): ConstraintDefinition {
  const mode = options?.mode || 'partially';
  function includeTag(tag: string | symbol | object) {
    return tags.includes(tag);
  }

  return (session) => {
    const currentTags = session.annotations.tagged || [];
    return mode == 'partially' ? currentTags.some(includeTag) : currentTags.every(includeTag);
  }
}

export function labelled(labels: InjectionAnnotations['labelled'] = [], options?: { mode: 'all' | 'partially' }): ConstraintDefinition {
  const mode = options?.mode || 'partially';
  function includeLabel([key, value]: [key: string | symbol, value: any]) {
    return labels[key] === value
  }

  return (session) => {
    const entries = Object.entries(session.annotations.labelled || {})
    return mode == 'partially' ? entries.some(includeLabel) : entries.every(includeLabel);
  }
}

export function context(ctx: Context): ConstraintDefinition {
  return (session) => session.ctx === ctx;
}

export function visible(type: 'public' | 'private'): ConstraintDefinition {
  return (session) => {
    switch(type) {
      case 'private': {
        return session.host === session.provider?.host
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
  const exportedTo = session.provider?.meta[exportedToInjectorsMetaKey] as WeakMap<Injector, any[] | true>;
  if (exportedTo) {
    const treeInjector = session.data[treeInjectorMetaKey];
    const names = exportedTo.get(treeInjector);
    if (Array.isArray(names)) {
      return names.includes(session.definition?.name);
    }
  }
  return true;
}

export function whenComponent(session: Session): boolean {
  return Boolean(session.parent) === false;
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
