import { setCurrentInjectionContext } from './inject';
import { processOnInitLifecycle, destroy } from './lifecycle-manager';
import { compareOrder, convertInjections, filterHooks, getTreeshakableProvider } from './metadata';
import { filterDefinitions, getOrCreateProviderInstance } from './provider';
import { Session } from './session';
import { InjectionKind, InstanceStatus, InjectionHookKind } from '../enums';
import { runHooks, runHooksWithProviders, SessionHook } from '../hooks';
import { circularSessionsMetaKey, promiseResolveMetaKey, promiseDoneMetaKey, treeInjectorMetaKey, definitionInjectionMetadataMetaKey, instancesToDestroyMetaKey } from '../private';
import { NoProviderError, CircularReferenceError } from "../problem";
import { getAllKeys, wait, waitAll, waitCallback } from '../utils';

import type { Injector } from './injector'
import type { ProviderRecord, ProviderDefinition, ProviderInstance, Provider as ClassicProvider, InjectionHook, FactoryDefinitionClass, FactoryDefinitionFactory, FactoryDefinitionValue, InjectionArgument, InjectableDefinition, InjectionItem, ProviderAnnotations, InjectionMetadata } from '../interfaces'

export function inject<T>(injector: Injector, argument: InjectionArgument, parentSession?: Session): T | Promise<T> {
  const session = Session.create(argument.token, argument.metadata, injector, parentSession);
  if (parentSession) {
    parentSession.children.push(session);
  }
  return resolve(injector, session, argument.hooks);
}

export function resolve<T>(injector: Injector, session: Session, hooks: Array<InjectionHook> = []): T | Promise<T> {
  if (injector.hooks.length) {
    const filteredHooks = filterHooks(injector.hooks, session);
    return wait(
      runHooks(filteredHooks, session, { kind: InjectionHookKind.INJECTOR }, (s) => runHooks(hooks, s, { kind: InjectionHookKind.INJECT }, resolveProvider)),
      result => {
        session.setFlag('resolved');
        return session.result = result
      },
    );
  }

  return wait(
    runHooks(hooks, session, { kind: InjectionHookKind.INJECT }, resolveProvider),
    result => {
      session.setFlag('resolved');
      return session.result = result;
    }
  )
}

export function resolveProvider<T>(session: Session): T | Promise<T> {
  const context = session.context;
  if (context.provider) {
    const provider = context.provider;
    context.injector = provider.host;
    return runHooks(filterHooks(provider.hooks, session), session, { kind: InjectionHookKind.PROVIDER }, resolveDefinition);
  }

  const token = session.iOptions.token;
  const injector = context.injector;
  let maybeProviders = injector.providers.get(token);
  if (!maybeProviders) {
    const treeshakable = getTreeshakableProvider(token as InjectableDefinition['token'], injector);
    if (treeshakable === null) {
      injector.providers.set(token, { self: null, imported: undefined });
      return resolveFromParent(session);
    }
    maybeProviders = injector.providers.get(token);
  }

  let { self, imported } = maybeProviders;
  if (self === undefined) {
    self = maybeProviders.self = getTreeshakableProvider(token as InjectableDefinition['token'], injector);
  }

  if (!imported) {
    if (self) {
      context.provider = self;
      if (self.when(session)) {
        return runHooks(filterHooks(self.hooks, session), session, { kind: InjectionHookKind.PROVIDER }, resolveDefinition);
      }
    }
    return resolveFromParent(session);
  }

  return runProvidersHooks(session, self ? [self, ...imported] : imported);
}

function runProvidersHooks(session: Session, providers: Array<ProviderRecord>) {
  session.meta[treeInjectorMetaKey] = session.context.injector;
  const hooks: Array<{ hook: InjectionHook, provider: ProviderRecord, annotations: ProviderAnnotations }> = [];
  providers.forEach(provider => {
    session.context.injector = (session.context.provider = provider).host;
    if (provider.when(session)) {
      provider.hooks.forEach(hook => {
        hook.when(session) && hooks.push({ hook: hook.hook, provider, annotations: hook.annotations })
      })
    }
  });

  if (hooks.length) {
    hooks.sort(compareOrder);
    return runHooksWithProviders(hooks, session, (s: Session) => findDefinition(s, providers));
  }
  return findDefinition(session, providers);
}

function findDefinition(session: Session, providers: Array<ProviderRecord>) {
  let defaultDefinition: ProviderDefinition | undefined;
  const context = session.context;
  for (let i = 0, l = providers.length; i < l; i++) {
    const provider = context.provider = providers[i];
    context.injector = provider.host;
    if (!provider.when(session)) {
      continue;
    }

    const definition = filterDefinitions(provider, session);
    if (definition && definition.when) {
      if (definition.default) {
        defaultDefinition = defaultDefinition || definition;
        continue;
      }
      session.meta[treeInjectorMetaKey] = undefined;
      context.definition = definition;
      return resolveDefinition(session);
    }
    defaultDefinition = defaultDefinition || definition;
  }

  if (defaultDefinition) {
    session.meta[treeInjectorMetaKey] = undefined;
    context.definition = defaultDefinition;
    return resolveDefinition(session);
  }
  session.context.injector = session.meta[treeInjectorMetaKey];
  return resolveFromParent(session);
}

export function resolveDefinition<T>(session: Session): T | Promise<T> {
  const context = session.context;
  let definition: ProviderDefinition = context.definition;
  if (definition) {
    context.injector = (context.provider = definition.provider).host;
    return runHooks(definition.hooks, session, { kind: InjectionHookKind.DEFINITION }, resolveInstance);
  }

  definition = context.definition = filterDefinitions(context.provider, session);
  if (!definition) {
    return resolveFromParent(session);
  }

  context.injector = (context.provider = definition.provider).host;
  return runHooks(definition.hooks, session, { kind: InjectionHookKind.DEFINITION }, resolveInstance);
}

export function resolveInstance<T>(session: Session): T | Promise<T> {
  // check dry run
  if (session.hasFlag('dry-run')) {
    return;
  }

  return wait(
    getOrCreateProviderInstance(session),
    handleInstance,
  )
}

function handleInstance(session: Session) {
  const instance = session.context.instance;
  if (instance.status & InstanceStatus.RESOLVED) {
    return instance.value;
  }

  // parallel or circular injection
  if (instance.status > InstanceStatus.UNKNOWN) {
    return resolveParallelInjection(session, instance);
  }

  instance.status |= InstanceStatus.PENDING;
  return wait(
    createInstance(session),
    value => processInstance(value, instance),
  );
}

function createInstance(session: Session) {
  const { injector, definition: { factory, meta } } = session.context;
  const previosuContext = setCurrentInjectionContext({ injector, session, metadata: meta[definitionInjectionMetadataMetaKey] });
  try {
    return factory.resolver(injector, session, factory.data)
  } finally {
    setCurrentInjectionContext(previosuContext);
  }
}

function processInstance(value: any, instance: ProviderInstance) {
  if (instance.status & InstanceStatus.CIRCULAR) {
    value = Object.assign(instance.value, value);
  }

  instance.value = value;
  return wait(
    processOnInitLifecycle(instance),
    () => {
      instance.status |= InstanceStatus.RESOLVED;
      // resolve pararell injections
      if (instance.status & InstanceStatus.PARALLEL) {
        const meta = instance.meta;
        meta[promiseResolveMetaKey](instance.value);
        delete meta[promiseResolveMetaKey];
        delete meta[promiseDoneMetaKey]
      }
      return instance.value;
    }
  );
}

function resolveFromParent<T>(session: Session): T | Promise<T> {
  const context = session.context;
  const injector = context.injector = context.injector.parent;
  if (injector === null) {
    throw new NoProviderError(session);
  }
  context.provider = context.definition = context.instance = undefined;
  return resolveProvider(session);
}

function resolveParallelInjection(session: Session, instance: ProviderInstance) {
  // check circular injection
  let tempSession = session;
  while (tempSession) {
    if (!tempSession) { // case when injection is performed by new injector.get() call - parallel injection
      break;
    }
    if (instance === (tempSession = tempSession.parent)?.context.instance) { // found circular references
      return handleCircularInjection(session, instance);
    }
  }

  // otherwise parallel injection detected (in async resolution)
  const meta = instance.meta;
  if (instance.status & InstanceStatus.PARALLEL) {
    return instance.meta[promiseDoneMetaKey];
  }

  instance.status |= InstanceStatus.PARALLEL;
  return meta[promiseDoneMetaKey] || (meta[promiseDoneMetaKey] = new Promise(resolve => {
    meta[promiseResolveMetaKey] = resolve;
  }));
}

function handleCircularInjection<T>(session: Session, instance: ProviderInstance<T>): T {
  // if circular injection detected return empty prototype instance
  if (instance.status & InstanceStatus.CIRCULAR) {
    return instance.value;
  }

  const proto = getPrototype(instance);
  if (!proto) {
    throw new CircularReferenceError();
  }
  instance.status |= InstanceStatus.CIRCULAR;

  // save sessions to perform initialization of dependencies in proper order
  const circularSessions: Array<Session> = [];
  session.setFlag('circular');
  let tempSession = session;
  while (tempSession) { 
    tempSession = tempSession.parent;
    tempSession.setFlag('circular');
    const annotations = tempSession.annotations;

    if (instance === tempSession.context.instance) { // found circular references
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
  }

  return instance.value = Object.create(proto); // create object from prototype (only classes)
}

function getPrototype<T>(instance: ProviderInstance<T>): Object {
  const provider = instance.definition.original;
  return typeof provider === 'function' ? provider.prototype : provider.useClass.prototype;
}

export function injectArray(injector: Injector, dependencies: Array<InjectionArgument>, session?: Session): Array<any> | Promise<Array<any>> {
  const injections = [];
  if (dependencies.length === 0) return injections;
  dependencies.forEach(dependency => {
    injections.push(inject(injector, dependency, session));
  });
  return waitAll(injections);
}

function injectProperties<T>(injector: Injector, instance: T, properties: Record<string | symbol, InjectionArgument>, session?: Session): Array<void> | Promise<Array<void>> {
  const propertiesNames = getAllKeys(properties);
  if (propertiesNames.length === 0) return;
  const injections = [];
  propertiesNames.forEach(prop => {
    injections.push(wait(
      inject(injector, properties[prop], session),
      value => instance[prop] = value,
    ));
  })
  return waitAll(injections);
}

function injectMethods<T>(injector: Injector, instance: T, methods: Record<string | symbol, Array<InjectionArgument>>, session: Session): any {
  const methodNames = getAllKeys(methods);
  if (methodNames.length === 0) return;
  getAllKeys(methods).forEach(methodName => {
    const deps = methods[methodName];
    if (deps.length) {
      instance[methodName] = injectMethod(injector, instance, instance[methodName], deps, session);
    }
  })
}

// TODO: Improve method injection - try to destroy instances injected by standalone inject function
const sessionHook = SessionHook();
export function injectMethod<T>(injector: Injector, instance: T, originalMethod: Function, injections: Array<InjectionArgument>, session: Session): Function {
  injections = injections.map(injection => injection && ({ ...injection, hooks: [sessionHook, ...injection.hooks] }));
  const injectionsLength = injections.length;

  const target = (instance as any).constructor;
  const descriptor = Object.getOwnPropertyDescriptor((target as any).prototype, originalMethod.name);
  const methodCtx = { 
    injector,
    session,
    metadata: {
      kind: InjectionKind.METHOD,
      target,
      descriptor,
    }
  };

  const cache: any[] = [];
  return function(...args: any[]) {
    let dependency: InjectionArgument = undefined;
    const actions: any[] = [];
    const instances: ProviderInstance[] = [];
    for (let i = 0; i < injectionsLength; i++) {
      if (args[i] === undefined && (dependency = injections[i])) {
        if (cache[i] !== undefined) {
          args[i] = cache[i];
          continue;
        }

        actions.push(wait(
          inject(injector, dependency, session),
          ({ result, session: s }: { result: any, session: Session }) => {
            if (!s.hasFlag('side-effect')) {
              cache[i] = result;
            }
            instances.push(s.context.instance);
            args[i] = result;
          }
        ));
      }
    }

    // TODO: Destroy instances when function will throw error;
    const ctxInstances = [];
    return waitAll(
      actions,
      () => waitCallback(
        () => {
          const ctx = { ...methodCtx, [instancesToDestroyMetaKey]: ctxInstances }
          const previosuContext = setCurrentInjectionContext(ctx);
          try {
            return originalMethod.apply(instance, args)
          } finally {
            setCurrentInjectionContext(previosuContext);
          }
        }, 
        result => {
          destroy([...instances, ...ctxInstances]);
          return result;
        },
      ),
    );
  }
}

export function resolverClass<T>(injector: Injector, session: Session, data: FactoryDefinitionClass<T>['data']): T | undefined | Promise<T | undefined> {
  const inject = data.inject;
  return wait(
    injectArray(injector, inject.parameters, session),
    deps => {
      const instance = new data.class(...deps);
      injectMethods(injector, instance, inject.methods, session);
      return wait(
        injectProperties(injector, instance, inject.properties, session),
        () => instance,
      );
    }
  );
}

export function resolverFactory<T>(injector: Injector, session: Session, data: FactoryDefinitionFactory<T>['data']): T | Promise<T> {
  return wait(
    injectArray(injector, data.inject, session),
    deps => data.factory(...deps),
  );
}

export function resolveClassicProvider<T>(injector: Injector, session: Session, data: FactoryDefinitionClass<T>['data']): T | undefined | Promise<T | undefined> {
  return wait(
    resolverClass(injector, session, data) as ClassicProvider,
    provider => provider.provide(),
  );
}

export function resolverValue<T>(_: Injector, __: Session, data: FactoryDefinitionValue<T>['data']): T {
  return data.value;
}

export function createFunction<T>(factory: (...args: any[]) => T | Promise<T>, injections: Array<InjectionItem> = []) {
  const metadata: InjectionMetadata = { kind: InjectionKind.FUNCTION, function: factory }
  const converted = convertInjections(injections, metadata);
  return (session: Session, args: any[] = []) => {
    const injector = session.context.injector;
    const previosuContext = setCurrentInjectionContext({ injector, session, metadata });
    try {
      return wait(
        injectArray(injector, converted, session),
        deps => factory(...args, ...deps),
      );
    } finally {
      setCurrentInjectionContext(previosuContext);
    }
  }
}
