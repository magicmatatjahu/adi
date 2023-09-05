import { Context } from './context';
import { when } from '../constraints';
import { wait } from '../utils';
import { resolveScope } from '../scopes';

import type { Injector } from './injector';
import type { Session } from './session';
import type { ProviderToken, ProviderRecord, ProviderDefinition, ProviderInstance, ScopeDefinition } from '../types';

export function getOrCreateProvider<T>(host: Injector, token: ProviderToken<T>): ProviderRecord<T> {
  let provider = host.providers.get(token);
  if (provider === undefined) {
    provider = { 
      self: createProvider(host, token),
      imported: undefined
    };
    host.providers.set(token, provider);
  }
  return (provider.self || (provider.self = createProvider(host, token)));
}

function createProvider<T>(host: Injector, token: ProviderToken<T>): ProviderRecord<T> {
  return {
    token,
    host,
    hooks: [],
    defs: [],
    when: when.always,
    annotations: {},
    meta: {},
  }
}

export function getOrCreateProviderInstance(session: Session) {
  const definition = session.context.definition!;

  let scopeDefinition = definition.scope;
  const scope = wait(
    resolveScope(scopeDefinition, session),
    result => {
      const customScope = session.inject.scope;
      if (customScope && result.scope.canBeOverrided(session, result.options)) {
        scopeDefinition = customScope;
        return resolveScope(customScope, session);
      }
      return result;
    }
  )

  return wait(
    wait(scope, result => result.scope.getContext(session, result.options)),
    ctx => getProviderInstance(session, ctx || Context.STATIC, scopeDefinition)
  )
}

function getProviderInstance(session: Session, context: Context, scope: ScopeDefinition): Session {
  const definition = session.context.definition!;
  let instance: ProviderInstance | undefined = definition.values.get(context);
  if (!instance) {
    instance = {
      definition,
      context,
      session,
      value: undefined,
      status: 1,
      scope,
      meta: {},
      parents: undefined,
    };
    definition.values.set(context, instance);
  }

  let parentInstance: Session | ProviderInstance | undefined = session.parent;
  if (parentInstance && (parentInstance = (parentInstance as Session).context.instance)) {
    (instance.parents || (instance.parents = new Set())).add(parentInstance);
  }

  session.context.instance = instance;
  return session;
}

export function filterDefinitions(provider: ProviderRecord, session: Session): ProviderDefinition | undefined;
export function filterDefinitions(provider: ProviderRecord, session: Session, filter: 'all' | 'satisfies' | undefined): Array<ProviderDefinition>;
export function filterDefinitions(provider: ProviderRecord, session: Session, filter?: 'all' | 'satisfies' | undefined): ProviderDefinition | Array<ProviderDefinition> | undefined {
  if (filter) {
    return filterProviderDefinitions(provider.defs, session, filter);
  }
  return __filterDefinition(provider.defs, session);
}

function __filterDefinition(definitions: Array<ProviderDefinition>, session: Session): ProviderDefinition | undefined {
  const context = session.context;
  let defaultDefinition: ProviderDefinition | undefined;

  for (let i = definitions.length - 1; i > -1; i--) {
    const definition = context.definition = definitions[i];

    if (!definition.when) {
      defaultDefinition = defaultDefinition || definition;
      continue;
    }
    
    if (definition.when(session)) {
      if (definition.default) {
        defaultDefinition = defaultDefinition || definition;
        continue;
      }
      return definition;
    }
  }

  return context.definition = defaultDefinition;
}

function filterProviderDefinitions(definitions: Array<ProviderDefinition>, session: Session, mode: 'all' | 'satisfies' = 'satisfies'): Array<ProviderDefinition> {
  const constraints: Array<ProviderDefinition> = [];
  const defaults: Array<ProviderDefinition> = [];
  const all: Array<ProviderDefinition> = [];
  
  const context = session.context;
  definitions.forEach(definition => {
    context.definition = definition;
    if (!definition.when) {
      defaults.push(definition);
      all.push(definition);
    } else if (definition.when(session)) {
      if (definition.default) {
        defaults.push(definition);
      } else {
        constraints.push(definition);
      }
      all.push(definition);
    }
  });
  context.definition = undefined;

  if (mode === 'satisfies') {
    return constraints.length ? constraints : defaults;
  }
  return all;
}
