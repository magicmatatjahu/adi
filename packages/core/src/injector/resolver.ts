import { setCurrentInjectionContext } from './inject';
import { processOnInitLifecycle, destroy } from './lifecycle-manager';
import { compareOrder, convertInjection, convertInjections, filterHooks, getTreeshakableProvider, parseInjectArguments } from './metadata';
import { filterDefinitions, getOrCreateProviderInstance } from './provider';
import { Session } from './session';
import { InjectionKind, InstanceStatus, InjectionHookKind, InjectorStatus } from '../enums';
import { runInjectioHooks, runInjectioHooksWithProviders, UseInstanceHook } from '../hooks/private';
import { cacheMetaKey, circularSessionsMetaKey, treeInjectorMetaKey, definitionInjectionMetadataMetaKey } from '../private';
import { NoProviderError, CircularReferenceError } from "../problem";
import { getAllKeys, isClassProvider, wait, waitAll, waitCallback, noopThen, noopCatch, resolvePromise } from '../utils';
import { getOrCreatePromise } from '../utils';

import type { Injector } from './injector'
import type { 
  ProviderToken, ProviderRecord, ProviderDefinition, ProviderInstance, 
  Provide as ClassicProvider, InjectionHook, FactoryDefinitionClass, FactoryDefinitionFactory, FactoryDefinitionValue, 
  InjectionArgument, InjectableDefinition, InjectionItem, 
  ProviderAnnotations, InjectionAnnotations, InjectionMetadata, InjectionHookContext, InjectionHookReturnType, InjectionContext,
} from '../types'

const injectorHookCtx: InjectionHookContext = { kind: InjectionHookKind.INJECTOR };
const injectHookCtx: InjectionHookContext = { kind: InjectionHookKind.INJECT };
const providerHookCtx: InjectionHookContext = { kind: InjectionHookKind.PROVIDER };
const definitionHookCtx: InjectionHookContext = { kind: InjectionHookKind.DEFINITION };

function getFromCache<T>(injector: Injector, key: InjectionArgument | ProviderToken): T {
  return injector.meta[cacheMetaKey].get(key);
}

function saveToCache(injector: Injector, key: InjectionArgument | ProviderToken, value: any): void {
  injector.meta[cacheMetaKey].set(key, value);
}

function removeCache(injector: Injector, key: InjectionArgument | ProviderToken): void {
  injector.meta[cacheMetaKey].delete(key);
}

export function inject<T = any>(ctx: InjectionContext, token: ProviderToken<T>): T | Promise<T>;
export function inject<T = any>(ctx: InjectionContext, annotations: InjectionAnnotations): T | Promise<T>;
export function inject<T = any>(ctx: InjectionContext, ...hooks: Array<InjectionHook>): T | Promise<T>;
export function inject<T = any>(ctx: InjectionContext, token: ProviderToken<T>, annotations: InjectionAnnotations): T | Promise<T>;
export function inject<T = any>(ctx: InjectionContext, token: ProviderToken<T>, ...hooks: Array<InjectionHook>): T | Promise<T>;
export function inject<T = any>(ctx: InjectionContext, annotations: InjectionAnnotations, ...hooks: Array<InjectionHook>): T | Promise<T>;
export function inject<T = any>(ctx: InjectionContext, token: ProviderToken<T>, annotations: InjectionAnnotations, ...hooks: Array<InjectionHook>): T | Promise<T>;
export function inject<T = any>(ctx: InjectionContext, token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, ...hooks: Array<InjectionHook>): T | Promise<T> {
  const { injector, metadata, session } = ctx;

  // only one argument - maybe cache
  let cacheKey: any;
  if (arguments.length === 1) {
    const cached = getFromCache<T>(injector, (cacheKey = token as ProviderToken<T>));
    if (cached !== undefined) {
      return cached;
    }
  }

  const arg = convertInjection(parseInjectArguments(token, annotations, hooks), metadata);
  return optimizedInject(injector, arg, session, cacheKey);
}

export function optimizedInject<T>(injector: Injector, argument: InjectionArgument, parentSession?: Session, cacheKey?: any): T | Promise<T> {
  const cached = getFromCache<T>(injector, argument);
  if (cached !== undefined) {
    return cached;
  }

  const { token, metadata, hooks } = argument;
  const session = Session.create(token, metadata, injector, parentSession);
  if (parentSession !== undefined) {
    parentSession.children.push(session);
  }

  return wait(
    resolve(injector, session, hooks),
    result => processResult(result, session, argument, cacheKey),
  )
}

export function resolve<T>(injector: Injector, session: Session, hooks: Array<InjectionHook> = []): T | Promise<T> {
  if (injector.status & InjectorStatus.HAS_HOOKS) {
    const filteredHooks = filterHooks(injector.hooks, session);
    return runInjectioHooks(filteredHooks, session, injectorHookCtx, (s: Session) => runInjectioHooks(hooks, s, injectHookCtx, resolveProvider));
  }
  if (hooks.length === 0) {
    return resolveProvider(session);
  }
  return runInjectioHooks(hooks, session, injectHookCtx, resolveProvider);
}

export function resolveProvider<T>(session: Session): T | Promise<T> {
  const context = session.context;
  if (context.provider !== undefined) {
    const provider = context.provider;
    context.injector = provider.host;
    return runInjectioHooks(filterHooks(provider.hooks, session), session, providerHookCtx, resolveDefinition);
  }

  const token = session.inject.token as ProviderToken;
  const injector = context.injector;
  let maybeProviders = injector.providers.get(token);
  if (maybeProviders === undefined) {
    const treeshakable = getTreeshakableProvider(token as InjectableDefinition['token'], injector);
    if (treeshakable === undefined) {
      injector.providers.set(token, { self: treeshakable || null, imported: undefined });
      return resolveFromParent(session);
    }
    maybeProviders = injector.providers.get(token);
  }

  let { self, imported } = maybeProviders!;
  if (self === undefined) {
    const treeshakable = getTreeshakableProvider(token as InjectableDefinition['token'], injector);
    self = maybeProviders!.self = treeshakable || null;
  }

  if (!imported) {
    if (self) {
      session.context.provider = self;
      if (self.when(session)) {
        return runInjectioHooks(filterHooks(self.hooks, session), session, providerHookCtx, resolveDefinition);
      }
    }
    return resolveFromParent(session);
  }

  return runProvidersHooks(session, self ? [self, ...imported] : imported);
}

function runProvidersHooks(session: Session, providers: Array<ProviderRecord>) {
  const context = session.context;
  session.meta[treeInjectorMetaKey] = context.injector;
  const hooks: Array<{ hook: InjectionHook, provider: ProviderRecord, annotations: ProviderAnnotations }> = [];

  providers.forEach(provider => {
    context.injector = (context.provider = provider).host;
    if (provider.when(session)) {
      provider.hooks.forEach(hook => {
        hook.when(session) && hooks.push({ hook: hook.hook, provider, annotations: hook.annotations })
      })
    }
  });

  if (hooks.length === 0) {
    return findDefinition(session, providers);
  }

  hooks.sort(compareOrder);
  return runInjectioHooksWithProviders(hooks, session, (s: Session) => findDefinition(s, providers));
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
  let { definition } = context;
  if (definition) {
    context.injector = (context.provider = definition.provider).host;
    return runInjectioHooks(definition.hooks, session, definitionHookCtx, resolveInstance);
  }

  definition = context.definition = filterDefinitions(context.provider!, session);
  if (!definition) {
    return resolveFromParent(session);
  }

  context.injector = (context.provider = definition.provider).host;
  return runInjectioHooks(definition.hooks, session, definitionHookCtx, resolveInstance);
}

export function resolveInstance<T>(session: Session): T | Promise<T> | undefined {
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
  const instance = session.context.instance!;
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
  const { injector, definition } = session.context;
  const { factory, meta } = definition!;
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
      // resolve pararell injection - if defined
      if (instance.status & InstanceStatus.PARALLEL) {
        resolvePromise(instance, value);
      }
      return value;
    }
  );
}

function processResult(result: any, session: Session, argument: InjectionArgument, cacheKey?: any) {
  if (session.hasFlag('side-effect') === false) {
    if (argument.token !== cacheKey) {
      cacheKey = argument;
    }
    saveToCache(session.context.injector, cacheKey, result); 
  }

  session.setFlag('resolved');
  return session.result = result;
}

function resolveFromParent<T>(session: Session): T | Promise<T> {
  const context = session.context;
  const injector = context.injector = context.injector.parent!;
  if (injector === null) {
    throw new NoProviderError(session);
  }
  context.provider = context.definition = context.instance = undefined;
  return resolveProvider(session);
}

function resolveParallelInjection(session: Session, instance: ProviderInstance) {
  // check circular injection
  let tempSession: Session | undefined = session;
  while (tempSession) {
    // case when injection is performed by new injector.get() call - parallel injection
    if (!tempSession) {
      break;
    }

    // found circular references
    if (instance === (tempSession = tempSession.parent)?.context.instance) {
      return handleCircularInjection(session, instance);
    }
  }

  // otherwise parallel injection detected (in async resolution)
  instance.status |= InstanceStatus.PARALLEL;
  return getOrCreatePromise(instance);
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
  let tempSession: Session | undefined = session.parent;
  while (tempSession) { 
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
    tempSession = tempSession.parent;
  }

  return instance.value = Object.create(proto); // create object from prototype (only classes)
}

function getPrototype<T>(instance: ProviderInstance<T>): Object | undefined {
  const provider = instance.definition.original;
  if (typeof provider === 'function') {
    return provider.prototype;
  } else if (isClassProvider(provider)) {
    return provider.useClass.prototype;
  }
}

export function injectArray(injector: Injector, dependencies: Array<InjectionArgument | undefined>, session?: Session): Array<any> | Promise<Array<any>> {
  const injections: any[] = [];
  if (dependencies.length === 0) {
    return injections;
  }

  dependencies.forEach(dependency => {
    injections.push(optimizedInject(injector, dependency!, session));
  });
  return waitAll(injections);
}

function injectProperties<T>(injector: Injector, instance: T, properties: Record<string | symbol, InjectionArgument>, session?: Session): Array<void> | Promise<Array<void>> {
  const propertiesNames = getAllKeys(properties);
  const injections: any[] = [];
  if (propertiesNames.length === 0) {
    return injections;
  }

  propertiesNames.forEach(prop => {
    injections.push(wait(
      optimizedInject(injector, properties[prop], session),
      value => instance[prop] = value,
    ));
  })
  return waitAll(injections);
}

function injectMethods<T>(injector: Injector, instance: T, methods: Record<string | symbol, Array<InjectionArgument | undefined>>, session: Session): any {
  const methodNames = getAllKeys(methods);
  if (methodNames.length === 0) {
    return;
  }

  getAllKeys(methods).forEach(methodName => {
    const deps = methods[methodName];
    if (deps.length) {
      instance[methodName] = injectMethod(injector, instance, instance[methodName], deps, session);
    }
  })
}

export function injectMethod<T>(injector: Injector, instance: T, originalMethod: Function, injections: Array<InjectionArgument | undefined>, session: Session): Function {
  injections = injections.map(injection => injection && ({ ...injection, hooks: [...injection.hooks, UseInstanceHook] }));
  const injectionsLength = injections.length;

  const cache: any[] = [];
  return function(...args: any[]) {
    let dependency: InjectionArgument | undefined = undefined;
    const actions: any[] = [];
    const instances: ProviderInstance[] = [];
    for (let i = 0; i < injectionsLength; i++) {
      if (args[i] === undefined && (dependency = injections[i])) {
        if (cache[i] !== undefined) {
          args[i] = cache[i];
          continue;
        }

        actions.push(wait(
          optimizedInject<InjectionHookReturnType<typeof UseInstanceHook>>(injector, dependency, session),
          ({ sideEffect, instance, result }) => {
            if (sideEffect === false) {
              cache[i] = result;
            }
            instances.push(instance);
            args[i] = result;
          }
        ));
      }
    }

    return waitAll(
      actions,
      () => waitCallback(
        () => originalMethod.apply(instance, args), 
        noopThen,
        noopCatch,
        () => destroy(instances)
      ),
    );
  }
}

export function resolverClass<T>(injector: Injector, session: Session, data: FactoryDefinitionClass<T>['data']): T | undefined | Promise<T | undefined> {
  const inject = data.inject;

  // TODO: optimize when there are only constructor parameters
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
  return data;
}

export function createFunction<T>(fn: (...args: any[]) => T | Promise<T>, injections: Array<InjectionItem> = []) {
  const metadata: InjectionMetadata = { kind: InjectionKind.FUNCTION, function: fn }
  const converted = convertInjections(injections, metadata);
  return (session: Session, args: any[] = []) => {
    const injector = session.context.injector;
    const previosuContext = setCurrentInjectionContext({ injector, session, metadata });
    try {
      return wait(
        injectArray(injector, converted, session),
        deps => fn(...args, ...deps),
      );
    } finally {
      setCurrentInjectionContext(previosuContext);
    }
  }
}
