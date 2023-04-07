import { processOnInitLifecycle, destroy } from './lifecycle-manager';
import { convertInjections, filterHooks, getTreeshakableProvider } from './metadata';
import { getOrCreateProviderInstance } from './provider';
import { Session } from './session';
import { InjectionKind, InstanceStatus, InjectionHookKind } from '../enums';
import { runHooks, SessionHook } from '../hooks';
import { circularSessionsMetaKey, promiseResolveMetaKey, promiseDoneMetaKey } from '../private';
import { NoProviderError, CircularReferenceError } from "../problem";
import { getAllKeys, wait, waitAll } from '../utils';

import type { Injector } from './injector'
import type { Provider } from './provider';
import type { ProviderDefinition, ProviderInstance, Provider as ClassicProvider, InjectionHook, FactoryDefinitionClass, FactoryDefinitionFactory, FactoryDefinitionValue, FactoryDefinitionFunction, InjectionArgument, InjectableDefinition, InjectionItem } from '../interfaces'

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
      runHooks(filteredHooks, session, InjectionHookKind.INJECTOR, (s) => runHooks(hooks, s, InjectionHookKind.INJECT, resolveProvider)),
      result => {
        session.setFlag('resolved');
        return session.result = result
      },
    );
  }

  return wait(
    runHooks(hooks, session, InjectionHookKind.INJECT, resolveProvider),
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
    return runHooks(filterHooks(provider.hooks, session), session, InjectionHookKind.PROVIDER, resolveDefinition);
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
      return runHooks(filterHooks(self.hooks, session), session, InjectionHookKind.PROVIDER, resolveDefinition);
    }
    return resolveFromParent(session);
  }

  return resolveImportedProviders(session, [self, ...imported], self ? 0 : 1) as T;
}

function resolveImportedProviders(originalSession: Session, providers: Array<Provider>, index: number, defaultDefinition?: ProviderDefinition) {
  if (providers.length === index) {
    return resolveFromParent(originalSession);
  }

  const session = originalSession.fork(); // fork session for every imported provider
  const provider = session.context.provider = providers[index];
  return runHooks(filterHooks(provider.hooks, session), session, InjectionHookKind.PROVIDER, currentSession => resolveImportedProvider(currentSession, originalSession, providers, index, defaultDefinition));
}

function resolveImportedProvider(currentSession: Session, originalSession: Session, providers: Array<Provider>, index: number, defaultDefinition?: ProviderDefinition) {
  const context = currentSession.context;
  const definition = context.provider.filter(currentSession);

  if (!definition) {
    if (providers.length === ++index && defaultDefinition) {
      context.injector = (context.provider = (context.definition = defaultDefinition).provider).host;
      return runHooks(defaultDefinition.hooks, currentSession, InjectionHookKind.PROVIDER, resolveInstance);
    }
    return resolveImportedProviders(originalSession, providers, index, defaultDefinition);
  }

  if (definition.when) { // handle constrained definition
    context.definition = definition;
    originalSession.apply(currentSession);
    return resolveDefinition(originalSession)
  }

  defaultDefinition = defaultDefinition || definition;
  if (providers.length === ++index && defaultDefinition) {
    context.definition = defaultDefinition;
    originalSession.apply(currentSession);
    return resolveDefinition(originalSession)
  }
  return resolveImportedProviders(originalSession, providers, index, defaultDefinition);
}

export function resolveDefinition<T>(session: Session): T | Promise<T> {
  const context = session.context;
  let definition: ProviderDefinition = context.definition;
  if (definition) {
    context.injector = (context.provider = definition.provider).host;
    return runHooks(definition.hooks, session, InjectionHookKind.DEFINITION, resolveInstance);
  }

  definition = context.definition = context.provider.filter(session);
  if (!definition) {
    return resolveFromParent(session);
  }

  context.injector = (context.provider = definition.provider).host;
  return runHooks(definition.hooks, session, InjectionHookKind.DEFINITION, resolveInstance);
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
  const { injector, definition: { factory }, instance } = session.context;
  if (instance.status & InstanceStatus.RESOLVED) {
    return instance.value;
  }

  // parallel or circular injection
  if (instance.status > InstanceStatus.UNKNOWN) {
    return resolveParallelInjection(session, instance);
  }

  instance.status |= InstanceStatus.PENDING;
  return wait(
    factory.resolver(injector, session, factory.data),
    value => processInstance(value, instance),
  );
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
  context.provider = context.definition = undefined;
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

const sessionHook = SessionHook();
function injectMethod<T>(injector: Injector, instance: T, originalMethod: Function, injections: Array<InjectionArgument>, session: Session): Function {
  injections = injections.map(injection => injection && ({ ...injection, hooks: [sessionHook, ...injection.hooks] }));
  const injectionsLength = injections.length;

  const cache: any[] = [];
  let nonSideEffect = false;
  return function(...args: any[]) {
    if (nonSideEffect) {
      for (let i = 0; i < injectionsLength; i++) {
        if (args[i] === undefined && cache[i] !== undefined) {
          args[i] = cache[i];
        }
      }
      return originalMethod.apply(instance, args);
    }

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

    nonSideEffect = instances.length === 0;
    return waitAll(
      actions,
      () => wait(
        originalMethod.apply(instance, args), 
        result => {
          destroy(instances);
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

export function resolveClassProvider<T>(injector: Injector, session: Session, data: FactoryDefinitionClass<T>['data']): T | undefined | Promise<T | undefined> {
  return wait(
    resolverClass(injector, session, data) as ClassicProvider,
    provider => provider.provide(),
  );
}

export function resolverValue<T>(_: Injector, __: Session, data: FactoryDefinitionValue<T>['data']): T {
  return data.value;
}

export function resolverFunction<T>(injector: Injector, session: Session, data: FactoryDefinitionFunction<T>['data']): T | Promise<T> {
  return wait(
    injectArray(injector, data.inject, session),
    deps => data.function(...data.arguments, ...deps) as any,
  );
}

export function createFunctionResolver<T>(factory: (...args: any[]) => T | Promise<T>, injections: Array<InjectionItem> = []) {
  const converted = convertInjections(injections, { kind: InjectionKind.FUNCTION, function: factory });
  return (session: Session, args: any[] = []) => {
    const injector = session.context.injector;
    if (args.length) {
      return wait(
        injectArray(injector, converted, session),
        deps => factory(...args, ...deps),
      );
    }
    return wait(
      injectArray(injector, converted, session),
      deps => factory(...deps),
    );
  }
}
