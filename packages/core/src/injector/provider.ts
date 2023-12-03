import { when } from '../constraints';
import { Context } from './context';
import { InstanceStatus, ProviderKind } from '../enums';
import { destroyProvider, destroyDefinition, destroy, processOnInitLifecycle } from './lifecycle-manager';
import { resolveScope } from '../scopes';
import { PromisesHub, isClassProvider, wait } from '../utils';
import { setCurrentInjectionContext } from './inject';
import { applyDynamicContext } from './dynamic-context';
import { definitionInjectionMetadataMetaKey, circularSessionsMetaKey, destroyHooksMetaKey } from '../private';
import { CircularReferenceError } from '../errors/circular-reference.error';
import { createCustomResolver } from './resolver';
import { compareOrder } from './metadata';

import type { Injector } from './injector';
import type { Session } from './session';
import type { Scope } from '../scopes/scope';
import type { ProviderToken, ScopeDefinition, ConstraintDefinition, InjectionHookRecord, ProviderInstanceMetadata, ProviderType, FactoryDefinition, InjectionHook, ProviderDefinitionAnnotations, ProviderRecordMetadata, OnDestroyOptions, CustomResolver } from '../types';

export const resolvedInstances = new WeakMap<object, ProviderInstance>();

export type ProviderDefinitionInput = {
  original: ProviderType,
  kind: ProviderKind,
  factory: FactoryDefinition,
  scope: ScopeDefinition,
  when?: ConstraintDefinition,
  hooks: Array<InjectionHook>,
  annotations: ProviderDefinitionAnnotations,
  name: string | symbol | object | undefined;
}

export class ProviderRecord {
  static for(key: ProviderToken | string | symbol, provider: ProviderType) {

  }

  static get(token: ProviderToken, host: Injector) {
    let provider = host.providers.get(token);
    if (!provider) {
      provider = { 
        self: new this(host, token),
        imported: undefined
      };
      host.providers.set(token, provider);
    }
    return (provider.self || (provider.self = new this(host, token)));
  }

  public hooks: InjectionHookRecord[] = [];
  public defs: ProviderDefinition[] = [];
  public when: ConstraintDefinition = when.always;
  public annotations = {};
  public meta = {};

  protected constructor(
    public host: Injector,
    public token: ProviderToken,
  ) {}

  definition(input: ProviderDefinitionInput): ProviderDefinition {
    return ProviderDefinition.create(this, input)
  }

  filter(session: Session): ProviderDefinition | undefined;
  filter(session: Session, filter: 'all' | 'satisfies' | undefined): Array<ProviderDefinition>;
  filter(session: Session, filter?: 'all' | 'satisfies' | undefined): ProviderDefinition | Array<ProviderDefinition> | undefined {
    if (filter) {
      return filterProviderDefinitions(this.defs, session, filter);
    }
    return __filterDefinition(this.defs, session);
  }

  destroy(): Promise<void> {
    return destroyProvider(this, { event: 'manually' });
  }
}

export class ProviderDefinition {
  public default: boolean;
  public values: Map<Context, ProviderInstance> = new Map();
  public meta: ProviderRecordMetadata = {};

  static create(provider: ProviderRecord, input: ProviderDefinitionInput) {
    const annotations = input.annotations;
    const definition = new this(
      provider,
      input.original,
      input.kind,
      input.factory,
      input.scope,
      input.when,
      input.hooks,
      annotations,
      input.name,
    )
    
    const defs = provider.defs;
    if (typeof annotations.order !== 'number') {
      annotations.order = 0;
    }

    defs.push(definition);
    defs.sort(compareOrder);

    return definition;
  }

  protected constructor(
    public provider: ProviderRecord,
    public original: ProviderType,
    public kind: ProviderKind,
    public factory: FactoryDefinition,
    public scope: ScopeDefinition,
    public when: ConstraintDefinition | undefined,
    public hooks: Array<InjectionHook>,
    public annotations: ProviderDefinitionAnnotations,
    public name: string | symbol | object | undefined,
  ) {
    this.default = when === undefined
  }

  instance(session: Session): ProviderInstance | Promise<ProviderInstance> {
    let scopeDefinition = this.scope;
    const scope = wait(
      resolveScope(scopeDefinition, session),
      result => {
        const customScope = session.scope;
        if (customScope && result.scope.canBeOverrided(session, result.options)) {
          scopeDefinition = customScope;
          return resolveScope(customScope, session);
        }
        return result;
      }
    )
  
    return wait(
      wait(scope, scopeDef => this.getContext(scopeDef, session)),
      ctx => ProviderInstance.get(this, ctx || Context.STATIC, scopeDefinition, session)
    )
  }

  destroy(): Promise<void> {
    return destroyDefinition(this, { event: 'manually' });
  }

  protected getContext(scopeDef: { scope: Scope<any>; options?: any; }, session: Session): Context | Promise<Context> {
    const { scope, options } = scopeDef;
    if (scope.isDynamic(session, options) === true) {
      session.setFlag('dynamic-scope')
      if (session.hasFlag('dynamic-resolution') === false) {
        return Context.DYNAMIC;
      }
    }
    return scope.getContext(session, options)
  }
}

export class ProviderInstance {
  static for(value: any): ProviderInstance | undefined {
    return resolvedInstances.get(value)
  }

  public value: any = undefined;
  public status: InstanceStatus = InstanceStatus.UNKNOWN;
  public parents: Set<ProviderInstance> | undefined = undefined;
  public meta: ProviderInstanceMetadata = {};

  static get(
    definition: ProviderDefinition,
    context: Context,
    scope: ScopeDefinition,
    session: Session,
  ): ProviderInstance {
    if (context === Context.DYNAMIC) {
      const instance = session.instance = new ProviderInstance(definition, context, scope, session)
      instance.value = {}
      instance.status |= InstanceStatus.RESOLVED;
      instance.status |= InstanceStatus.DYNAMIC_SCOPE;
      session.setFlag('side-effect')
      applyDynamicContext(instance, session)
      return instance;
    }
    
    let instance: ProviderInstance | undefined = definition.values.get(context);
    if (!instance) {
      instance = new ProviderInstance(definition, context, scope, session)
      definition.values.set(context, instance);
    }
  
    // link parent instances
    let temp: Session | ProviderInstance | undefined = session.parent;
    if (temp && (temp = (temp as Session).instance)) {
      (instance.parents || (instance.parents = new Set())).add(temp);
    }

    return session.instance = instance;
  }

  protected constructor(
    public definition: ProviderDefinition,
    public context: Context,
    public scope: ScopeDefinition,
    public session: Session,
  ) {}

  resolve(session: Session) {
    if (this.status & InstanceStatus.RESOLVED) {
      return this.value;
    }
  
    // parallel or circular injection
    if (this.status > InstanceStatus.UNKNOWN) {
      return resolveParallelInjection(this, session);
    }
  
    this.status |= InstanceStatus.PENDING;
    return wait(
      this.create(),
      value => this.process(value),
    );
  }

  onDestroy<T>(handler: ((value: T) => void | Promise<void>) | OnDestroyOptions<T>): { cancel(): void } {
    const resolver: CustomResolver = createCustomResolver({ kind: 'function', handler: (handler as OnDestroyOptions).onDestroy || handler, inject: (handler as OnDestroyOptions<T>).inject });
    const meta = this.meta
    const hooks: CustomResolver[] = meta[destroyHooksMetaKey] || (meta[destroyHooksMetaKey] = []);
    hooks.push(resolver);

    return {
      cancel() {
        const indexOf = hooks.indexOf(resolver);
        if (indexOf === -1) return;
        hooks.splice(indexOf, 1);
      }
    }
  }

  destroy(): Promise<void> {
    return destroy(this, { event: 'manually' });
  }

  protected create() {
    const session = this.session
    const injector = session.injector
    const { factory, meta } = this.definition;
    const previosuContext = setCurrentInjectionContext({ injector, session, metadata: meta[definitionInjectionMetadataMetaKey] });
    try {
      return factory.resolver(injector, session, factory.data)
    } finally {
      setCurrentInjectionContext(previosuContext);
    }
  }

  protected process(value: any) {
    if (this.status & InstanceStatus.CIRCULAR) {
      value = Object.assign(this.value, value);
    }
  
    this.value = value;
    return wait(
      processOnInitLifecycle(this),
      () => {
        this.status |= InstanceStatus.RESOLVED;

        // assign resolved value to provider instance for future processing
        if (typeof value === 'object' && value) {
          resolvedInstances.set(value, this)
        }

        // resolve pararell injection - if defined
        if (this.status & InstanceStatus.PARALLEL) {
          PromisesHub.resolve(this, value);
        }

        return value;
      }
    );
  }
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
  let defaultDefinition: ProviderDefinition | undefined;

  for (let i = definitions.length - 1; i > -1; i--) {
    const definition = session.definition = definitions[i];

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

  return session.definition = defaultDefinition;
}

function filterProviderDefinitions(definitions: Array<ProviderDefinition>, session: Session, mode: 'all' | 'satisfies' = 'satisfies'): Array<ProviderDefinition> {
  const constraints: Array<ProviderDefinition> = [];
  const defaults: Array<ProviderDefinition> = [];
  const all: Array<ProviderDefinition> = [];
  
  definitions.forEach(definition => {
    session.definition = definition;
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
  session.definition = undefined;

  if (mode === 'satisfies') {
    return constraints.length ? constraints : defaults;
  }
  return all;
}

function resolveParallelInjection(instance: ProviderInstance, session: Session): Object | Promise<Object> {  
  // check circular injection
  let tempSession: Session | undefined = session;
  while (tempSession) {
    // case when injection is performed by Injector.create.get() call - parallel injection
    if (!tempSession) {
      break;
    }

    // found circular references
    if (instance === (tempSession = tempSession.parent)?.instance) {
      return handleCircularInjection(instance, session);
    }
  }

  // otherwise parallel injection detected (in async resolution)
  instance.status |= InstanceStatus.PARALLEL;
  return PromisesHub.create(instance);
}

function handleCircularInjection(instance: ProviderInstance, session: Session): Object {
  // if circular injection detected return empty prototype instance
  if (instance.status & InstanceStatus.CIRCULAR) {
    return instance.value;
  }

  const proto = getPrototype(instance);
  if (!proto) {
    throw new CircularReferenceError({ session });
  }
  instance.status |= InstanceStatus.CIRCULAR;

  // save sessions to perform initialization of dependencies in proper order
  const circularSessions: Array<Session> = [];
  session.setFlag('circular');
  let tempSession: Session | undefined = session.parent;
  while (tempSession) { 
    tempSession.setFlag('circular');
    const annotations = tempSession.annotations;

    if (instance === tempSession.instance) { // found circular references
      const currentSession = tempSession;
      
      tempSession = tempSession.parent;
      if (tempSession?.hasFlag('circular')) { // maybe circular injection is deeper
        while (tempSession) {
          const parent = tempSession.parent;
          if (!parent || !parent.hasFlag('circular')) { // reassign the circular references to the deeper context
            const sessions = tempSession.annotations[circularSessionsMetaKey];
            const index = (sessions).indexOf(currentSession);
            sessions.splice(index, 0, ...circularSessions);
            break;
          }
          tempSession = parent;
        }
      } else {
        annotations[circularSessionsMetaKey] = circularSessions;
      }
      break;
    }

    const sessions = annotations[circularSessionsMetaKey];
    if (sessions) {
      circularSessions.unshift(...sessions);
      delete annotations[circularSessionsMetaKey];
    }
    circularSessions.push(tempSession);
    tempSession = tempSession.parent;
  }

  return instance.value = Object.create(proto); // create object from prototype (only classes)
}

function getPrototype(instance: ProviderInstance): Object | undefined {
  const provider = instance.definition.original;
  if (typeof provider === 'function') {
    return provider.prototype;
  } else if (isClassProvider(provider)) {
    return provider.useClass.prototype;
  }
}