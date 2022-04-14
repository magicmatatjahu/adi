import { InjectionToken } from "./injection-token";
import { resolveRecord, factoryClass, factoryFactory, factoryValue } from "./resolver";
import { Session } from "./session";
import { INITIALIZERS, STATIC_CONTEXT } from "../constants";
import { when } from "../constraints";
import { ProviderKind, InjectionKind, InstanceStatus } from "../enums";
import { createHook } from "../hooks";
import { getInjectableDefinition } from "../decorators/injectable";
import { DefaultScope } from "../scopes";

import type { Injector } from "./injector";
import type { 
  ProviderToken, Provider, ClassTypeProvider, CustomProvider, ClassProvider, FactoryProvider, ValueProvider, ExistingProvider,
  ProviderRecord, HookRecord,
  DefinitionFactory, InjectionItem, PlainInjectionItem, PlainInjections, InjectionArgument, InjectionArguments, InjectionMetadata, InjectionHook, ConstraintDefinition, ProviderAnnotations, ProviderDefinition, ProviderInstance, InjectorScope, InjectionAnnotations,
} from "../interfaces";

export function toProviderRecord<T>(host: Injector, provider: Provider<T>): { record: ProviderRecord, definition: ProviderDefinition } | undefined {
  if (typeof provider === "function") {
    return typeProviderToRecord(host, provider);
  } else {
    return customProviderToProviderRecord(host, provider);
  }
}

function typeProviderToRecord<T>(host: Injector, provider: ClassTypeProvider<T>): { record: ProviderRecord, definition: ProviderDefinition } | undefined {
  const def = getInjectableDefinition(provider);
  if (def === undefined) return;

  const record = getRecord(host, provider);
  const factory = { factory: factoryClass, data: { classType: provider, inject: def.injections } };
  const options = def.options;
  const annotations = options.annotations || {};
  const definition: ProviderDefinition = { kind: ProviderKind.CLASS, provider, record, factory, scope: options.scope || DefaultScope, when: undefined, hooks: options.hooks || [], annotations, values: new Map(), meta: {} };
  record.defs.push(definition);
  // record.defs.sort(compareOrder);
  handleProviderAnnotations(record, definition, annotations);
  return { record, definition };
}

function customProviderToProviderRecord<T>(host: Injector, provider: CustomProvider<T>): { record: ProviderRecord, definition: ProviderDefinition } | undefined {
  const token = provider.provide;

  // injector hooks
  if (!token && provider.hooks) {
    addHook(host, provider.hooks, provider.when, provider.annotations);
    return;
  }

  const record = getRecord(host, token);
  let factory: DefinitionFactory,
    kind: ProviderKind,
    scope = provider.scope || DefaultScope,
    hooks = provider.hooks || [],
    when = provider.when,
    annotations = provider.annotations || {};

  if (isFactoryProvider(provider)) {
    kind = ProviderKind.FACTORY;
    const inject = convertDependencies(provider.inject || [], { kind: InjectionKind.FACTORY, handler: provider.useFactory });
    factory = { factory: factoryFactory, data: { useFactory: provider.useFactory, inject } };
  } else if (isValueProvider(provider)) {
    kind = ProviderKind.VALUE;
    factory = { factory: factoryValue, data: provider.useValue };
  } else if (isClassProvider(provider)) {
    const def = getInjectableDefinition(provider.useClass);
    if (def) {
      const options = def.options;
      const defScope = options.scope;
      if (defScope && defScope.kind.canBeOverrided({} as any, defScope.options) === false) { // TODO: fix first argument to the `canBeOverrided` function
        scope = defScope;
      }
      annotations = (Object.keys(annotations).length ? annotations : options.annotations) || {};
    }
    
    const inject = overrideDependencies(def?.injections, provider.inject) || {};
    kind = ProviderKind.CLASS;
    factory = { factory: factoryClass, data: { classType: provider.useClass, inject } };
  } else if (isExistingProvider(provider)) {
    kind = ProviderKind.ALIAS;
    hooks.push(useExistingHook(provider.useExisting));
  } else if (Array.isArray(provider.hooks)) { // case with standalone `hooks`
    addHook(record, hooks, when, annotations);
    return { record, definition: undefined };
  }

  // add provider definition
  const definition: ProviderDefinition = { kind, provider, record, factory, scope, when, hooks, annotations, values: new Map(), meta: {} };
  record.defs.push(definition);
  // record.defs.sort(compareOrder);
  handleProviderAnnotations(record, definition, annotations);
  return { record, definition };
}

export function getProviderInstance<T>(session: Session): ProviderInstance<T> {
  const def = session.ctx.def;
  let scope = def.scope;
  if (scope.kind.canBeOverrided(session, scope.options)) {
    scope = session.options.scope || scope;
  }

  const ctx = scope.kind.getContext(session, scope.options) || STATIC_CONTEXT;
  let instance = def.values.get(ctx);
  if (instance === undefined) {
    instance = {
      def,
      session,
      ctx,
      value: undefined,
      status: InstanceStatus.UNKNOWN,
      scope,
      meta: {},
      children: undefined,
      parents: undefined,
    };
    def.values.set(ctx, instance);
  }

  // add links
  if (session.parent) {
    const parentInstance = session.parent.ctx.instance;
    // TODO: retrieve first instance
    if (parentInstance) {
      (parentInstance.children || (parentInstance.children = new Set())).add(instance);
      (instance.parents || (instance.parents = new Set())).add(parentInstance);
    }
  }

  return instance;
}

export function filterProviderDefinition(defs: Array<ProviderDefinition>, session: Session): ProviderDefinition | undefined {
  let defaultDefinition: ProviderDefinition = undefined;
  for (let i = defs.length - 1; i > -1; i--) {
    const def = defs[i];
    if (def.when === undefined) { // default def
      defaultDefinition = defaultDefinition || def;
    } else if (def.when(session) === true) {
      return def;
    }
  }
  return defaultDefinition;
}

export function filterProviderDefinitions(defs: Array<ProviderDefinition>, session: Session, mode: 'defaults' | 'constraints' | 'all' = 'constraints'): Array<ProviderDefinition> {
  const satisfiedDefinitions: Array<ProviderDefinition> = [];
  const defaultDefs: Array<ProviderDefinition> = [];
  for (let i = defs.length - 1; i > -1; i--) {
    const def = defs[i];
    if (def.when === undefined) { // default def
      defaultDefs.push(def);
      mode === 'all' && satisfiedDefinitions.push(def);
    } else if (mode !== 'defaults' && def.when(session) === true) {
      satisfiedDefinitions.push(def);
    }
  }
  if (mode === 'defaults') return defaultDefs;
  return satisfiedDefinitions.length ? satisfiedDefinitions : defaultDefs;
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

export function createSession(token: ProviderToken, metadata: InjectionMetadata, injector: Injector, parentSession?: Session): Session {
  return new Session({ token, ctx: undefined, scope: undefined, annotations: {} }, { injector, record: undefined, def: undefined, instance: undefined }, metadata, parentSession);
}

export function serializeInjectArguments<T = any>(token?: ProviderToken<T>): PlainInjectionItem<T>;
export function serializeInjectArguments<T = any>(hooks?: Array<InjectionHook>): PlainInjectionItem<T>;
export function serializeInjectArguments<T = any>(annotations?: InjectionAnnotations): PlainInjectionItem<T>;
export function serializeInjectArguments<T = any>(token?: ProviderToken<T>, annotations?: InjectionAnnotations): PlainInjectionItem<T>;
export function serializeInjectArguments<T = any>(hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations): PlainInjectionItem<T>;
export function serializeInjectArguments<T = any>(token?: ProviderToken<T>, hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations): PlainInjectionItem<T>;
export function serializeInjectArguments<T = any>(token?: ProviderToken<T> | Array<InjectionHook> | InjectionAnnotations, hooks?: Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations): PlainInjectionItem<T> {
  if (typeof token === 'object' && !(token instanceof InjectionToken)) { // case with one argument
    if (Array.isArray(token)) { // hooks
      annotations = hooks as InjectionAnnotations;
      hooks = token;
    } else {
      annotations = token as InjectionAnnotations;
    }
    token = undefined;
  } else if (typeof hooks === 'object' && !Array.isArray(hooks)) { // case with two arguments argument
    annotations = hooks as InjectionAnnotations;
    hooks = [];
  }
  annotations = annotations || {};
  return { token: token as ProviderToken, hooks: hooks as Array<InjectionHook>, annotations };
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
): Array<InjectionArgument>;
export function overrideDependencies(
  original: InjectionArguments,
  overriding: Array<InjectionItem> | PlainInjections,
): InjectionArguments
export function overrideDependencies(
  original: Array<InjectionArgument> | InjectionArguments,
  overriding: Array<InjectionItem> | PlainInjections,
) {
  if (overriding === undefined) {
    return original;
  }
  return original;

  // if (Array.isArray(original)) {
  //   return;
  // }
  // if (Array.isArray(overriding)) {
  //   return;
  // }

  // const newDeps: InjectionArguments = {
  //   parameters: [...original.parameters],
  //   properties: { ...original.properties },
  //   methods: { ...original.methods },
  // };

  // const { parameters, properties, methods, override } = overriding;
  // if (typeof override === 'function') {

  // }

  // // properties and symbols
  // const props = Object.keys(properties);
  // props.push(...Object.getOwnPropertySymbols(properties) as any[]);

}

function overrideArrayDependencies(
  arg: InjectionArgument,
  to: InjectionArgument,
  metadata: InjectionMetadata,
  override: (arg: InjectionArgument) => InjectionItem | undefined,
) {
  if (to) return convertDependency(to, metadata);
  const inject = override(arg); 
  return inject && convertDependency(inject, metadata);
}

const nopeOverride = () => undefined;
function overrideInjectionArgument(
  arg: InjectionArgument,
  to: InjectionArgument,
  metadata: InjectionMetadata,
  override: (arg: InjectionArgument) => InjectionItem | undefined,
) {
  if (to) return convertDependency(to, metadata);
  const inject = override(arg); 
  return inject && convertDependency(inject, metadata);
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

export function compareOrder(a: { annotations: ProviderAnnotations }, b: { annotations: ProviderAnnotations }): number {
  return a.annotations['adi:order'] - b.annotations['adi:order'];
}

export function getHostInjector(session: Session): Injector | undefined {
  if (session.parent) return session.parent.ctx.record.host;
  if (session.metadata.kind & InjectionKind.STANDALONE) return session.metadata.target as Injector;
  return;
}

let DEFINITION_ID = 0;
function handleProviderAnnotations(record: ProviderRecord, definition: ProviderDefinition, annotations: ProviderAnnotations) {
  const uid = annotations['adi:uid'] = `adi:uid:${DEFINITION_ID++}`;
  let name = annotations['adi:name'];
  if (name || typeof name === 'string') {
    addConstraint(definition, when.named(name, false));
  } else {
    name = annotations['adi:name'] = uid;
  }
  if (typeof annotations['adi:order'] !== 'number') {
    annotations['adi:order'] = 0;
  }
  if (Object.keys(annotations).length === 3) return;

  // if (annotations['adi:override']) {
  //   const override = annotations['adi:override'];
  // }

  if (annotations['adi:tags']) {
    addConstraint(definition, when.tagged(annotations['adi:tags'], false));
  }
  if (annotations['adi:visible']) {
    addConstraint(definition, when.visible(annotations['adi:visible']));
  }

  if (annotations['adi:component'] === true) {
    definition.hooks.unshift(useComponentHook);
    addConstraint(definition, when.visible('private'));
  }
  if (annotations['adi:aliases']) {
    annotations['adi:aliases'].forEach(alias => {
      const { definition: def } = customProviderToProviderRecord(record.host, {
        provide: alias, 
        useExisting: record.token,
      });
      def.hooks.pop(); // remove useExistingHook;
      def.hooks.push(useExistingDefinitionHook(definition)); // add useExistingDefinitionHook;
    })
  }
  if (annotations['adi:eager'] === true) {
    const { definition: def } = customProviderToProviderRecord(record.host, {
      provide: INITIALIZERS, 
      useExisting: record.token,
    });
    def.hooks.pop(); // remove useExistingHook;
    def.hooks.push(useExistingDefinitionHook(definition)); // add useExistingDefinitionHook;
  }
}

function addHook(
  obj: { hooks: Array<HookRecord> },
  hooks: Array<InjectionHook>,
  constraint: ConstraintDefinition = when.always,
  annotations: ProviderAnnotations = {},
): void {
  if (typeof annotations['adi:order'] !== 'number') {
    annotations['adi:order'] = 0;
  }

  obj.hooks.push(
    ...hooks.map(hook => ({
      hook,
      when: constraint,
      annotations,
    }),
  ));
  obj.hooks.sort(compareOrder);
}

function addConstraint(definition: ProviderDefinition, constraint: ConstraintDefinition) {
  definition.when = definition.when ? when.and(constraint, definition.when) : constraint;
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

function getTreeshakableProvider(injector: Injector, token: ProviderRecord): ProviderRecord | undefined {
  let provideIn = getInjectableDefinition(token)?.options?.provideIn;
  if (provideIn === undefined) {
    return;
  }

  // provideIn = Array.isArray(provideIn) ? provideIn : [provideIn];
  // let record: ProviderRecord;  
  // if (isProviderInInjectorScope(injector.options.scopes, provideIn)) {
  //   record = toProviderRecord(injector, typeof token === 'function' ? token : {});
  //   if (typeof token === "function") { // type provider case
  //     record = typeProviderToRecord(token as Type, injector);
  //   } else { // injection token case
  //     record = customProviderToRecord(token, def as any, injector);
  //   }
  // } else { // imports case
  //   const annotations = def?.options?.annotations || EMPTY_OBJECT;
  //   if (annotations[ANNOTATIONS.EXPORT] !== true) {
  //     return;
  //   }
  // }
}

function isProviderInInjectorScope(scopes: Array<InjectorScope>, provideIn?: Array<InjectorScope>): boolean {
  return provideIn.some(scope => scopes.includes(scope));
}

const useExistingHook = createHook((token: ProviderToken) => {
  return (session) => {
    const ctx = session.ctx;
    ctx.record = ctx.def = undefined;
    session.options.token = token;
    return resolveRecord(session);
  }
}, { name: 'adi:hook:use-existing' });

const useExistingDefinitionHook = createHook((definition: ProviderDefinition) => {
  return (session) => {
    const ctx = session.ctx;
    session.options.token = (ctx.record = (ctx.def = definition).record).token;
    return resolveRecord(session);
  }
}, { name: 'adi:hook:use-existing-definition' });

const useComponentHook = createHook(() => {
  return (session, next) => {
    if (session.parent || getHostInjector(session) !== session.ctx.injector) {
      throw new Error('Component cannot be injected to another one provider');
    }
    return next(session);
  }
}, { name: 'adi:hook:use-component' })();
