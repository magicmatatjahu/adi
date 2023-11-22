import { setCurrentInjectionContext } from './inject';
import { processOnInitLifecycle } from './lifecycle-manager';
import { setInstanceContext } from './method-injection';
import { compareOrder, convertInjection, convertInjections, createInjectionArgument, createInjectionMetadata, filterHooks, getTreeshakableProvider, parseInjectArguments } from './metadata';
import { filterDefinitions, getOrCreateProviderInstance } from './provider';
import { Session } from './session';
import { InjectionKind, InstanceStatus, InjectionHookKind, InjectorStatus } from '../enums';
import { runInjectioHooks, runInjectioHooksWithProviders } from '../hooks/private';
import { cacheMetaKey, circularSessionsMetaKey, treeInjectorMetaKey, definitionInjectionMetadataMetaKey } from '../private';
import { NotFoundProviderError } from "../errors/not-found-provider.error";
import { CircularReferenceError } from "../errors/circular-reference.error";
import { getAllKeys, isClassProvider, wait, waitAll, noopCatch, isPromiseLike, PromisesHub } from '../utils';

import type { Injector } from './injector'
import type { 
  ProviderToken, ProviderRecord, ProviderDefinition, ProviderInstance, 
  Provide as ClassicProvider, InjectionHook, FactoryDefinitionClass, FactoryDefinitionFactory, FactoryDefinitionValue, CustomResolver, CustomResolverOptions,
  InjectionArgument, InjectableDefinition,
  ProviderAnnotations, InjectionAnnotations, InjectionHookContext, InjectionContext,
} from '../types'
import { injectableDefinitions } from './injectable';

const injectorHookCtx: Partial<InjectionHookContext> = { kind: InjectionHookKind.INJECTOR };
const injectHookCtx: Partial<InjectionHookContext> = { kind: InjectionHookKind.INJECT };
const providerHookCtx: Partial<InjectionHookContext> = { kind: InjectionHookKind.PROVIDER };
const definitionHookCtx: Partial<InjectionHookContext> = { kind: InjectionHookKind.DEFINITION };

function getFromCache<T>(injector: Injector, key: InjectionArgument | ProviderToken): T {
  return injector.meta[cacheMetaKey].get(key);
}

function saveToCache(injector: Injector, key: InjectionArgument | ProviderToken, value: any): void {
  injector.meta[cacheMetaKey].set(key, value);
}

// TODO: Remove from cache also the injection arguments (use for that tokens) 
export function removeCache(injector: Injector, key: InjectionArgument | ProviderToken): void {
  injector.meta[cacheMetaKey].delete(key);
}

export function inject<T = any>(ctx: InjectionContext, token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, hooks?: Array<InjectionHook>): T | Promise<T> {
  const { injector, metadata, session } = ctx;

  // only one argument - maybe cache
  let cacheToken: ProviderToken | undefined;
  if (annotations === undefined && token) {
    const cached = getFromCache<T>(injector, (cacheToken = token as ProviderToken<T>));
    if (cached !== undefined) {
      return cached;
    }
  }

  const argument = convertInjection(parseInjectArguments(token, annotations, hooks), metadata);
  return optimizedInject(injector, session, argument, ctx, cacheToken);
}

export function optimizedInject<T>(injector: Injector, parentSession: Session | undefined, argument: InjectionArgument, ctx?: Partial<InjectionContext>, cacheToken?: ProviderToken): T | Promise<T> {
  const cached = getFromCache<T>(injector, argument);
  if (cached) {
    return cached;
  }

  const { token, annotations, hooks, metadata } = argument;
  const session = Session.create(token, annotations, metadata, injector, parentSession);
  if (parentSession) {
    parentSession.children.push(session);
  }

  if (ctx) {
    ctx.current = session;
  }

  const injection = resolve(injector, session, hooks)
  if (isPromiseLike(injection)) {
    session.setFlag('async');
  }

  return wait(
    injection,
    result => processResult(result, session, argument, ctx, cacheToken),
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
        PromisesHub.resolve(instance, value);
      }
      return value;
    }
  );
}

function processResult(result: any, session: Session, argument: InjectionArgument, ctx?: Partial<InjectionContext>, cacheToken?: ProviderToken | InjectionArgument) {
  if (session.hasFlag('side-effect') === false) {
    // try to cache
    // const hasSingleArgument = cacheToken !== undefined && argument.token === cacheToken
    // if (hasSingleArgument === false) {
    //   cacheToken = argument;
    // }
    // saveToCache(session.context.injector, cacheToken as any, result); 
  } else if (ctx?.toDestroy) {
    // add instance to destroy
    ctx.toDestroy.push(session.context.instance!);
  }

  session.setFlag('resolved');
  return session.result = result;
}

function resolveFromParent<T>(session: Session): T | Promise<T> {
  const context = session.context;
  const injector = context.injector.parent as Injector;
  if (injector === null) {
    throw new NotFoundProviderError({ session });
  }
  context.injector = injector!;
  context.provider = context.definition = context.instance = undefined;
  return resolveProvider(session);
}

function resolveParallelInjection(session: Session, instance: ProviderInstance) {
  // check circular injection
  let tempSession: Session | undefined = session;
  while (tempSession) {
    // case when injection is performed by Injector.create.get() call - parallel injection
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
  return PromisesHub.create(instance);
}

function handleCircularInjection<T>(session: Session, instance: ProviderInstance<T>): T {
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
    injections.push(optimizedInject(injector, session, dependency!));
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
      optimizedInject(injector, session, properties[prop]),
      value => instance[prop] = value,
    ));
  })
  return waitAll(injections);
}

function injectMethods<T>(injector: Injector, instance: T, injections: Record<string | symbol, Array<InjectionArgument | undefined>>, session: Session): void {
  const methodNames = getAllKeys(injections);
  if (methodNames.length === 0) {
    return;
  }

  // pass injections because they can be overwritten by "overwrite" plugin from @adi/common
  setInstanceContext(instance, { injector, session, injections })
}

export function resolveClass<T>(injector: Injector, session: Session, data: FactoryDefinitionClass<T>['data']): T | Promise<T> {
  const { class: clazz, inject } = data;

  // TODO: optimize when there are only constructor parameters
  return wait(
    injectArray(injector, inject.parameters, session),
    deps => {
      const instance = new clazz(...deps);
      injectMethods(injector, instance, inject.methods, session);
      return wait(
        injectProperties(injector, instance, inject.properties, session),
        () => instance,
      );
    }
  );
}

export function resolveFactory<T>(injector: Injector, session: Session, data: FactoryDefinitionFactory<T>['data']): T | Promise<T> {
  const { factory, inject } = data;
  return wait(
    injectArray(injector, inject, session),
    deps => factory(...deps),
  );
}

export function resolveClassicProvider<T>(injector: Injector, session: Session, data: FactoryDefinitionClass<T>['data']): T | undefined | Promise<T | undefined> {
  return wait(
    resolveClass(injector, session, data) as ClassicProvider,
    provider => provider.provide(),
  );
}

export function resolveValue<T>(_: Injector, __: Session, data: FactoryDefinitionValue<T>['data']): T {
  return data;
}

export function createCustomResolver<T>(options: CustomResolverOptions<T>): CustomResolver<T> {
  switch (options.kind) {
    case 'class': {
      const { class: clazz, asStandalone } = options;
      if (asStandalone) {
        const definition = injectableDefinitions.ensure(clazz);
        const inject = definition.injections;
        return (session: Session) => resolveClass(session.context.injector, session, { class: clazz, inject });
      }

      const metadata = createInjectionMetadata({ kind: InjectionKind.CUSTOM, target: clazz });
      const argument = createInjectionArgument(clazz, undefined, undefined, metadata)
      return (session: Session) => optimizedInject(session.context.injector, session, argument);
    }
    case 'function': 
    default: {
      const { handler, inject } = options;
      if (!inject) {
        return (_: Session, ...args: any[]) => handler(...args);
      }

      const metadata = createInjectionMetadata({ kind: InjectionKind.FUNCTION, function: handler })
      const converted = convertInjections(inject, metadata);
      return (session: Session, ...args: any[]) => {
        const injector = session.context.injector;
        const previosuContext = setCurrentInjectionContext({ injector, session, metadata });
        return wait(
          injectArray(injector, converted, session),
          deps => handler(...args, ...deps),
          noopCatch,
          () => setCurrentInjectionContext(previosuContext),
        );
      }
    }
  }
}
