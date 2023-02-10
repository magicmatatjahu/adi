import { processOnInitLifecycle, destroy } from './lifecycle-manager';
import { convertInjections, filterHooks, getTreeshakableProvider } from './metadata';
import { getOrCreateProviderInstance } from './provider';
import { Session } from './session';
import { InjectionKind, InstanceStatus } from '../enums';
import { runHooks, SessionHook } from '../hooks';
import { circularSessionsMetaKey, promiseResolveMetaKey, promiseDoneMetaKey } from '../private';
import { NoProviderError } from "../problem";
import { getAllKeys, wait, waitAll } from '../utils';

import type { Injector } from './injector'
import type { Provider } from './provider';
import type { ProviderDefinition, ProviderInstance, InjectionHook, FactoryDefinitionClass, FactoryDefinitionFactory, FactoryDefinitionValue, FactoryDefinitionFunction, InjectionArgument, InjectableDefinition, InjectionItem } from '../interfaces'

export function inject<T>(injector: Injector, argument: InjectionArgument, parentSession?: Session): T | Promise<T> {
  const session = Session.create(argument.token, argument.metadata, injector, parentSession);
  if (parentSession) {
    parentSession.children.push(session);
  }
  return resolve(injector, session, argument.hooks);
}

export function resolve<T>(injector: Injector, session: Session, hooks: Array<InjectionHook> = []): T | Promise<T> {
  const filteredHooks = filterHooks(injector.hooks, session);
  filteredHooks.push(...hooks);
  return wait(
    runHooks(hooks, session, resolveProvider),
    result => session.result = result,
  );
}

export function resolveProvider<T>(session: Session): T | Promise<T> {
  const context = session.context;
  if (context.provider) {
    const provider = context.provider;
    context.injector = provider.host;
    return runHooks(filterHooks(provider.hooks, session), session, resolveDefinition);
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
      return runHooks(filterHooks(self.hooks, session), session, resolveDefinition);
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
  return runHooks(filterHooks(provider.hooks, session), session, currentSession => resolveImportedProvider(currentSession, originalSession, providers, index, defaultDefinition));
}

function resolveImportedProvider(currentSession: Session, originalSession: Session, providers: Array<Provider>, index: number, defaultDefinition?: ProviderDefinition) {
  const context = currentSession.context;
  const definition = context.provider.filter(currentSession);

  if (!definition) {
    if (providers.length === ++index && defaultDefinition) {
      context.injector = (context.provider = (context.definition = defaultDefinition).provider).host;
      return runHooks(defaultDefinition.hooks, currentSession, resolveInstance);
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
    return runHooks(definition.hooks, session, resolveInstance);
  }

  definition = context.definition = context.provider.filter(session);
  if (!definition) {
    return resolveFromParent(session);
  }

  context.injector = (context.provider = definition.provider).host;
  return runHooks(definition.hooks, session, resolveInstance);
}

export function resolveInstance<T>(session: Session): T | Promise<T> {
  // check dry run
  if (session.hasFlag('dry-run')) {
    return;
  }

  const context = session.context;
  const instance = context.instance = getOrCreateProviderInstance(session);

  if (instance.status & InstanceStatus.RESOLVED) {
    return instance.value;
  }

  // parallel or circular injection
  if (instance.status > InstanceStatus.UNKNOWN) {
    return resolveParallelInjection(session, instance);
  }

  instance.status |= InstanceStatus.PENDING;
  const { definition: { factory }, injector } = context;
  return wait(
    factory.resolver(injector, session, factory.data),
    value => {
      if (instance.status & InstanceStatus.CIRCULAR) {
        value = Object.assign(instance.value, value);
      }

      instance.value = value;
      return wait(
        processOnInitLifecycle(instance),
        () => {
          instance.status |= InstanceStatus.RESOLVED;
          // resolve pararell injections
          instance.meta[promiseResolveMetaKey]?.(instance.value); // fix place for that - it should be called at the end in some first hook
          return instance.value;
        }
      );
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
    throw new Error("Circular Dependency");
  }

  instance.status |= InstanceStatus.CIRCULAR;
  return instance.value = Object.create(proto);
  // const circularSessions: Array<Session> = [];
  // let doBreak = false, tempSession = session;
  // while (tempSession) {
  //   if (instance === (tempSession = tempSession.parent)?.ctx.instance) { // found circular references
  //     doBreak = true;
  //   }

  //   tempSession.setFlag(SessionFlag.CIRCULAR);
  //   circularSessions.push(tempSession);

  //   if (doBreak === true) {
  //     let deeper = false;
  //     let deeperSession = tempSession;
  //     while (deeperSession?.parent?.hasFlag(SessionFlag.CIRCULAR)) { // case when circular references are deeper
  //       deeper = true;
  //       deeperSession = deeperSession.parent;
  //     }
  //     if (deeper) {
  //       const index = (deeperSession.meta[circularSessionsMetaKey] as any[]).indexOf(tempSession);
  //       deeperSession.meta[circularSessionsMetaKey].splice(index, 1, ...circularSessions);
  //     } else {
  //       tempSession.meta[circularSessionsMetaKey] = circularSessions;
  //     }
  //     break;
  //   } else if (tempSession.meta[circularSessionsMetaKey]) {
  //     tempSession.meta[circularSessionsMetaKey].pop(); // remove duplication of the last session - it is inside 'circularSessions'
  //     circularSessions.unshift(...tempSession.meta[circularSessionsMetaKey]);
  //     delete tempSession.meta[circularSessionsMetaKey];
  //   }
  // }

  // return instance.value = Object.create(proto); // create object from prototype (only classes)
}

function getPrototype<T>(instance: ProviderInstance<T>): Object {
  const provider = instance.definition.original;
  return typeof provider === 'function' ? provider.prototype : provider.useClass;
}

function injectArray(injector: Injector, dependencies: Array<InjectionArgument>, session?: Session): Array<any> | Promise<Array<any>> {
  const injections = [];
  dependencies.forEach(dependency => {
    injections.push(inject(injector, dependency, session));
  });
  return waitAll(injections);
}

function injectProperties<T>(injector: Injector, obj: T, properties: Record<string | symbol, InjectionArgument>, session?: Session): Array<void> | Promise<Array<void>> {
  const injections = [];
  getAllKeys(properties).forEach(prop => {
    injections.push(wait(
      inject(injector, properties[prop], session),
      value => obj[prop] = value,
    ));
  })
  return waitAll(injections);
}

function injectMethods<T>(injector: Injector, obj: T, methods: Record<string | symbol, Array<InjectionArgument>>, session: Session): any {
  getAllKeys(methods).forEach(methodName => {
    const deps = methods[methodName];
    if (deps.length) {
      obj[methodName] = injectMethod(injector, obj[methodName], deps, session);
    }
  })
}

// TODO: optimize it by saving non side-effects dependencies
const sessionHook = SessionHook();
function injectMethod<T>(injector: Injector, originalMethod: Function, injections: Array<InjectionArgument>, session: Session): Function {
  injections = injections.map(injection => ({ ...injection, hooks: [sessionHook, ...injection.hooks] }));

  const cache: any[] = [];
  return function(this: T, ...args: any[]) {
    let dependency: InjectionArgument = undefined;
    const actions: any[] = [];
    const instances: ProviderInstance[] = [];

    for (let i = 0, l = injections.length; i < l; i++) {
      if (args[i] === undefined && (dependency = injections[i])) {
        if (cache[i]) {
          args[i] = cache[i];
          continue;
        }

        actions.push(wait(
          inject(injector, dependency, session),
          ({ result, session }: { result: any, session: Session }) => {
            if (!session.hasFlag('side-effect')) {
              cache[i] = result;
            }
            instances.push(session.context.instance);
            args[i] = result;
          }
        ));
      }
    }

    return waitAll(
      actions,
      () => wait(
        originalMethod.apply(this, args), 
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
