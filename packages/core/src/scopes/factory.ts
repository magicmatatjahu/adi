import { inject } from '../injector/resolver';
import { createInjectionMetadata } from '../injector';
import { InjectionKind } from '../enums';
import { ADI_SCOPE_DEF } from '../private';
import { createArray, wait } from '../utils';

import type { Session } from '../injector';
import type { Scope } from './scope';
import type { ClassType, ScopeDefinition, ScopeInstance, ScopeType, InjectionHook, InjectionAnnotations } from '../types';

export function createScope<O>(scope: Scope<O>, defaultOptions: O): ScopeInstance<O> {
  function scopeType(options: O): ScopeInstance<O> {
    return createScope(scope, { ...defaultOptions, ...options, });
  };

  (scopeType as ScopeInstance<O>)[ADI_SCOPE_DEF] = {
    kind: 'object',
    scope,
    options: defaultOptions,
  };

  return scopeType as ScopeInstance<O>;
}

export function getScopeDefinition<O>(scope: ScopeType<O>): ScopeDefinition<O> {
  const def = scope[ADI_SCOPE_DEF];
  if (def) {
    return def;
  }

  const maybeScope = (scope as any).scope;
  let hooks: InjectionHook[] | undefined,
    annotations: InjectionAnnotations | undefined,
    options: O | undefined;

  if (maybeScope) {
    scope = maybeScope.scope;
    hooks = createArray(maybeScope.hooks);
    annotations = maybeScope.annotations;
    options = maybeScope.options
  }

  if (typeof (scope as Scope<O>).getContext === 'function') {
    return {
      kind: 'instance',
      scope: scope as Scope<O>,
      options: options,
    };
  }

  return {
    kind: 'provider',
    scope: undefined,
    provider: scope as ClassType<Scope<O>>,
    options: options,
  };
}

export function resolveScope<O>(def: ScopeDefinition<O>, session: Session) {
  if (def.kind !== 'provider') {
    return def;
  }

  const scope = def.scope;
  if (scope) {
    return {
      scope,
      options: def.options,
    }
  }

  const injector = session.injector;
  const { provider, options } = def;
  const parentMetadata = session.metadata;
  const metadata = createInjectionMetadata({ 
    kind: InjectionKind.SCOPE, 
    target: parentMetadata.target, 
    function: parentMetadata.function,
  })
  return wait(
    inject({ injector, metadata, session: session.parent }, provider),
    instance => ({ scope: instance, options })
  )
}
