import { setCurrentInjectionContext } from './inject';
import { ProviderRecord, ProviderDefinition } from './provider';
import { setInstanceContext } from './method-injection';
import { compareOrder, convertInjection, convertInjections, createInjectionArgument, createInjectionMetadata, filterHooks, getTreeshakableProvider, parseInjectArguments } from './metadata';
import { filterDefinitions } from './provider';
import { Session } from './session';
import { InjectionKind, InjectionHookKind, InjectorStatus, InstanceStatus } from '../enums';
import { runInjectioHooks, runInjectioHooksWithProviders } from '../hooks/private';
import { treeInjectorMetaKey } from '../private';
import { NotFoundProviderError } from "../errors/not-found-provider.error";
import { getAllKeys, wait, waitAll, noopCatch, isPromiseLike } from '../utils';
import { injectableDefinitions } from './injectable';
import { getFromCache, saveToCache } from './cache';

import type { CacheToken } from './cache'
import type { Injector } from './injector'
import type { 
  ProviderToken,
  Provide as ClassicProvider, InjectionHook, FactoryDefinitionClass, FactoryDefinitionFactory, FactoryDefinitionValue, CustomResolver, CustomResolverOptions,
  InjectionArgument, InjectableDefinition,
  ProviderAnnotations, InjectionAnnotations, InjectionHookContext, InjectionContext,
} from '../types'

const injectorHookCtx: Partial<InjectionHookContext> = { kind: InjectionHookKind.INJECTOR };
const injectHookCtx: Partial<InjectionHookContext> = { kind: InjectionHookKind.INJECT };
const providerHookCtx: Partial<InjectionHookContext> = { kind: InjectionHookKind.PROVIDER };
const definitionHookCtx: Partial<InjectionHookContext> = { kind: InjectionHookKind.DEFINITION };

export function inject<T = any>(ctx: InjectionContext, token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, hooks?: Array<InjectionHook>): T | Promise<T> {
  const { injector, metadata, session } = ctx;

  // only one argument - maybe cache
  let cacheToken: CacheToken | undefined;
  if (annotations === undefined && token) {
    const cached = getFromCache<T>(injector, (cacheToken = token as ProviderToken), session);
    if (cached !== undefined) {
      return cached;
    }
  }

  const argument = convertInjection(parseInjectArguments(token, annotations, hooks), metadata);
  return injectProvider(injector, argument, session, ctx, cacheToken);
}

export function injectArgument<T>(injector: Injector, argument: InjectionArgument, parentSession?: Session, ctx?: Partial<InjectionContext>): T | Promise<T> {
  const cached = getFromCache<T>(injector, argument, parentSession);
  if (cached !== undefined) {
    // TODO: Create new session for cached value - for persist sessions between calls
    return cached;
  }
  return injectProvider(injector, argument, parentSession, ctx, argument)
}

function injectProvider(injector: Injector, argument: InjectionArgument, parentSession?: Session, ctx?: Partial<InjectionContext>, cacheToken?: CacheToken) {
  const { hooks, ...rest } = argument as Required<InjectionArgument>;
  const session = Session.create({ ...rest, injector }, parentSession);
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
    result => processResult(result, session, ctx, cacheToken),
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
  if (session.provider !== undefined) {
    const provider = session.provider;
    session.injector = provider.host;
    return runInjectioHooks(filterHooks(provider.hooks, session), session, providerHookCtx, resolveDefinition);
  }

  const token = session.token as ProviderToken;
  const injector = session.injector;
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
      session.provider = self;
      if (self.when(session)) {
        return runInjectioHooks(filterHooks(self.hooks, session), session, providerHookCtx, resolveDefinition);
      }
    }
    return resolveFromParent(session);
  }

  return runProvidersHooks(session, self ? [self, ...imported] : imported);
}

function runProvidersHooks(session: Session, providers: Array<ProviderRecord>) {
  session.data[treeInjectorMetaKey] = session.injector;
  const hooks: Array<{ hook: InjectionHook, provider: ProviderRecord, annotations: ProviderAnnotations }> = [];

  providers.forEach(provider => {
    session.injector = (session.provider = provider).host;
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

  for (let i = 0, l = providers.length; i < l; i++) {
    const provider = session.provider = providers[i];
    session.injector = provider.host;
    if (!provider.when(session)) {
      continue;
    }

    const definition = filterDefinitions(provider, session);
    if (definition && definition.when) {
      if (definition.default) {
        defaultDefinition = defaultDefinition || definition;
        continue;
      }

      session.data[treeInjectorMetaKey] = undefined;
      session.definition = definition;
      return resolveDefinition(session);
    }
    defaultDefinition = defaultDefinition || definition;
  }

  if (defaultDefinition) {
    session.data[treeInjectorMetaKey] = undefined;
    session.definition = defaultDefinition;
    return resolveDefinition(session);
  }

  session.injector = session.data[treeInjectorMetaKey];
  return resolveFromParent(session);
}

export function resolveDefinition<T>(session: Session): T | Promise<T> {
  let definition = session.definition;
  if (definition) {
    session.injector = (session.provider = definition.provider).host;
    return runInjectioHooks(definition.hooks, session, definitionHookCtx, resolveInstance);
  }

  definition = session.definition = filterDefinitions(session.provider!, session);
  if (!definition) {
    return resolveFromParent(session);
  }

  session.injector = (session.provider = definition.provider).host;
  return runInjectioHooks(definition.hooks, session, definitionHookCtx, resolveInstance);
}

export function resolveInstance<T>(session: Session): T | Promise<T> | undefined {
  // check dry run
  if (session.hasFlag('dry-run')) {
    return;
  }

  return wait(
    session.definition!.instance(session),
    instance => instance.resolve(session)
  )
}

function processResult(result: any, session: Session, ctx?: Partial<InjectionContext>, cacheToken?: CacheToken) {
  // try to cache static instance or with side effects (but not dynamic)
  if (session.hasFlag('side-effect') === false && cacheToken) {
    saveToCache(session.injector, cacheToken, result, session);
  } else {
    ctx?.toDestroy?.push(session.instance!);
  }

  session.setFlag('resolved');
  return session.result = result;
}

function resolveFromParent<T>(session: Session): T | Promise<T> {
  const injector = session.injector.parent as Injector;
  if (injector === null) {
    throw new NotFoundProviderError({ session });
  }

  session.injector = injector!;
  session.provider = session.definition = session.instance = undefined;
  return resolveProvider(session);
}

export function injectArray(injector: Injector, dependencies: Array<InjectionArgument | undefined>, session?: Session): Array<any> | Promise<Array<any>> {
  const injections: any[] = [];
  if (dependencies.length === 0) {
    return injections;
  }

  dependencies.forEach(dependency => {
    injections.push(injectArgument(injector, dependency!, session));
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
      injectArgument(injector, properties[prop], session),
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
        return (session: Session) => resolveClass(session.injector, session, { class: clazz, inject });
      }

      const metadata = createInjectionMetadata({ kind: InjectionKind.CUSTOM, target: clazz });
      const argument = createInjectionArgument(clazz, undefined, undefined, metadata)
      return (session: Session) => injectArgument(session.injector, argument, session);
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
        const injector = session.injector;
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
