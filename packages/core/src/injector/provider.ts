import { STATIC_CONTEXT } from '../constants';

import type { Injector } from './injector';
import type { Session } from './session';
import type { ProviderToken, ProviderDefinition, ProviderInstance, HookRecord } from '../interfaces';

export class Provider<T = any> {
  public defs: Array<ProviderDefinition> = [];
  public hooks: Array<HookRecord> = [];

  constructor(
    public readonly token: ProviderToken<T>,
    public readonly host: Injector,
  ) {}

  filter(session: Session): ProviderDefinition | undefined;
  filter(session: Session, filter: 'all' | 'satisfies'): Array<ProviderDefinition>;
  filter(session: Session, filter?: 'all' | 'satisfies'): ProviderDefinition | Array<ProviderDefinition> | undefined {
    if (filter) {
      return filterProviderDefinitions(this.defs, session, filter);
    }
    return filterDefinition(this.defs, session);
  }
}

export function getOrCreateProvider<T>(host: Injector, token: ProviderToken<T>): Provider {
  let provider = host.providers.get(token);
  if (!provider) {
    provider = { self: new Provider(token, host), imported: undefined };
    host.providers.set(token, provider);
  }
  return (provider.self || (provider.self = new Provider(token, host)));
}

export function getOrCreateProviderInstance<T>(session: Session): ProviderInstance {
  const definition = session.context.definition;
  let scope = definition.scope;
  if (session.iOptions.scope && scope.kind.canBeOverrided(session, scope.options)) {
    scope = session.iOptions.scope;
  }

  const context = scope.kind.getContext(session, scope.options) || STATIC_CONTEXT;
  let instance = definition.values.get(context);
  if (!instance) {
    instance = {
      definition,
      context,
      session,
      value: undefined,
      status: 0,
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

  return instance;
}

function filterDefinition(definitions: Array<ProviderDefinition>, session: Session): ProviderDefinition | undefined {
  let defaultDefinition: ProviderDefinition;
  for (let i = definitions.length - 1; i > -1; i--) {
    const definition = definitions[i];
    if (!definition.when) {
      defaultDefinition = defaultDefinition || definition;
    } else if (definition.when(session)) {
      return definition;
    }
  }
  return defaultDefinition;
}

export function filterProviderDefinitions(definitions: Array<ProviderDefinition>, session: Session, filter: 'all' | 'satisfies' = 'satisfies'): Array<ProviderDefinition> {
  const constraints: Array<ProviderDefinition> = [];
  const defaults: Array<ProviderDefinition> = [];
  const all: Array<ProviderDefinition> = [];

  definitions.forEach(definition => {
    const when = definition.when;
    if (!when) {
      defaults.push(definition);
      all.push(definition);
    } else if (when(session)) {
      constraints.push(definition);
      all.push(definition);
    }
  });

  if (filter === 'satisfies') {
    return constraints.length ? constraints : defaults;
  }
  return all;
}