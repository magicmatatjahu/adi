import { factoryClass, factoryFactory, factoryValue } from "./resolver";
import { STATIC_CONTEXT, ALWAYS_CONSTRAINT } from "../constants";
import { ProviderKind, InjectionKind, InstanceStatus } from "../enums";
import { createHook } from "../hooks";
import { getInjectableDefinition } from "../decorators/injectable";
import { DefaultScope, SingletonScope } from "../scopes";

import type { Injector } from "./injector";
import type { Session } from "./session";
import type { 
  ProviderToken, Provider, ClassTypeProvider, CustomProvider, ClassProvider, FactoryProvider, ValueProvider, ExistingProvider,
  ProviderRecord, HookRecord,
  DefinitionFactory, InjectionItem, PlainInjectionItem, PlainInjections, InjectionArgument, InjectionArguments, InjectionMetadata, InjectionHook, ConstraintDefinition, Annotations, ProviderDefinition, ProviderInstance,
} from "../interfaces";

export function toProviderRecord<T>(host: Injector, provider: Provider<T>): ProviderRecord | undefined {
  if (typeof provider === "function") {
    return typeProviderToRecord(host, provider);
  } else {
    return customProviderToProviderRecord(host, provider);
  }
}

function typeProviderToRecord<T>(host: Injector, provider: ClassTypeProvider<T>): ProviderRecord | undefined {
  const def = getInjectableDefinition(provider);
  if (def === undefined) return;

  const record = getRecord(host, provider);
  const factory = { factory: factoryClass, data: provider };
  const options = def.options;
  record.defs.push({ kind: ProviderKind.CLASS, provider, record, factory, scope: options.scope || DefaultScope, when: undefined, hooks: options.hooks, annotations: options.hooks, values: new Map(), meta: {} });
}

function customProviderToProviderRecord<T>(host: Injector, provider: CustomProvider<T>): ProviderRecord | undefined {
  const token = provider.provide;
  // standalone hooks
  if (!token && provider.hooks) {
    addHook(host, [...(provider.hooks || [])], provider.when, provider.annotations);
    return;
  }

  const record = getRecord(host, token);
  let factory: DefinitionFactory,
    kind: ProviderKind,
    scope = provider.scope || DefaultScope,
    hooks = [...(provider.hooks || [])],
    when = provider.when,
    annotations = provider.annotations || {};

  if (isFactoryProvider(provider)) {
    kind = ProviderKind.FACTORY;
    const inject = convertDependencies(provider.inject || [], { kind: InjectionKind.FACTORY, handler: provider.useFactory });
    factory = { factory: factoryFactory, data: { useFactory: provider.useFactory, inject } };
  } else if (isValueProvider(provider)) {
    kind = ProviderKind.VALUE;
    scope = SingletonScope;
    factory = { factory: factoryValue, data: provider.useValue };
  } else if (isClassProvider(provider)) {
    kind = ProviderKind.CLASS;
    factory = { factory: factoryClass, data: provider.useValue }; // TODO: fix that
  } else if (isExistingProvider(provider)) {
    kind = ProviderKind.ALIAS;
    hooks.push(useExistingHook(token));
  } else if (Array.isArray(provider.hooks)) { // case with standalone `hooks`
    addHook(record, hooks, when, annotations);
    return record;
  }

  // add provider definition
  record.defs.push({ kind, provider, record, factory, scope, when, hooks, annotations, values: new Map(), meta: {} });
  return record;
}

export function getProviderInstance<T>(session: Session): ProviderInstance<T> {
  const def = session.ctx.def;
  let scope = def.scope;
  if (scope.scope.canBeOverrided()) {
    scope = session.options.scope || scope;
  }

  const ctx = scope.scope.getContext(session, scope.options) || STATIC_CONTEXT;
  let instance = def.values.get(ctx);
  if (instance === undefined) {
    instance = {
      ctx,
      value: undefined,
      def,
      status: InstanceStatus.UNKNOWN,
      scope,
      meta: {},
    };
    def.values.set(ctx, instance);
  }
  return instance;
}

export function filterProviderDefinition(defs: Array<ProviderDefinition>, session: Session): ProviderDefinition | undefined {
  let defaultDefinition: ProviderDefinition = undefined;
  for (let i = defs.length - 1; i > -1; i--) {
    const def = defs[i];
    if (def.when && def.when(session) === true) {
      return def;
    } else {
      defaultDefinition = defaultDefinition || def;
    }
  }
  return defaultDefinition;
}

export function filterHooks(hooks: Array<HookRecord>, session: Session) {
  const satisfyingHooks: Array<InjectionHook> = [];
  for (let i = 0, l = hooks.length; i < l; i++) {
    if (hooks[i].when(session) === true) {
      satisfyingHooks.push(hooks[i].hook);
    }
  }
  return satisfyingHooks;
}

export function createInjectionArgument<T>(token: ProviderToken<T>, hooks: Array<InjectionHook> = [], metadata: InjectionMetadata): InjectionArgument<T> {
  return { token, hooks, metadata };
}

export function convertDependency<T>(dep: InjectionItem<T>, metadata: InjectionMetadata): InjectionArgument<T> {
  // hooks case
  if (Array.isArray(dep)) {
    return createInjectionArgument(undefined, dep, metadata);
  }
  // plain injection case
  const plainDep = dep as PlainInjectionItem;
  if (plainDep.token !== undefined) {
    return createInjectionArgument(plainDep.token, plainDep.hooks, metadata);
  }
  // standalone token case
  return createInjectionArgument(dep as ProviderToken, undefined, metadata);
}

export function convertDependencies(deps: Array<InjectionItem>, metadata: Omit<InjectionMetadata, 'index'>): InjectionArgument[] {
  const converted: InjectionArgument[] = [];
  for (let i = 0, l = deps.length; i < l; i++) {
    converted.push(convertDependency(deps[i], { ...metadata, index: i }));
  }
  return converted;
}

export function overrideDependencies(
  original: Array<InjectionArgument>,
  overriding: Array<InjectionItem>,
  metadata: InjectionMetadata,
): Array<InjectionArgument>;
export function overrideDependencies(
  original: InjectionArguments,
  overriding: Array<InjectionItem> | PlainInjections,
  metadata: InjectionMetadata,
): InjectionArguments
export function overrideDependencies(
  original: Array<InjectionArgument> | InjectionArguments,
  overriding: Array<InjectionItem> | PlainInjections,
  metadata: InjectionMetadata,
) {
  if (overriding === undefined) {
    return original;
  }
}

export function isClassProvider(provider: unknown): provider is ClassProvider {
  return 'useClass' in (provider as ClassProvider);
}

export function isFactoryProvider(provider: unknown): provider is FactoryProvider {
  return typeof (provider as FactoryProvider).useFactory === "function";
}

export function isValueProvider(provider: unknown): provider is ValueProvider {
  return 'useValue' in (provider as ValueProvider);
}

export function isExistingProvider(provider: unknown): provider is ExistingProvider {
  return 'useExisting' in (provider as ExistingProvider);
}

function getRecord<T>(host: Injector, token: ProviderToken<T>): ProviderRecord {
  const record = host.providers.get(token) || [];
  if (record[0] === undefined) {
    const provider = record[0] = { token, host, defs: [], hooks: [] }
    host.providers.set(token, record);
    return provider;
  }
  return record[0];
}

function addHook(
  obj: { hooks: Array<HookRecord> },
  hooks: Array<InjectionHook>,
  when: ConstraintDefinition = ALWAYS_CONSTRAINT,
  annotations: Annotations = {},
): void {
  obj.hooks.push(
    ...hooks.map(hook => ({
      hook,
      when,
      annotations,
    }),
  ));
}

// function getTreeshakableProvider(): ProviderRecord {

// }

const useExistingHook = createHook((token: ProviderToken) => {
  return (session) => {
    const ctx = session.ctx;
    ctx.record = ctx.def = ctx.instance = undefined;
    session.options.token = token;
    return ctx.injector.get(token, undefined, session);
  }
}, { name: 'adi:hook:use-existing' });
