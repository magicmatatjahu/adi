import { injectableDefinitions, injectableMixin } from './injectable';
import { Provider as ProviderRecord, getOrCreateProvider, Provider } from './provider';
import { resolveProvider, resolverClass, resolverFactory, resolverValue } from './resolver';
import { INITIALIZERS } from '../constants';
import { when } from '../constraints';
import { ProviderKind, InjectionKind } from '../enums';
import { createHook, isHook } from '../hooks';
import { ComponentProviderError } from '../problem';
import { DefaultScope, SingletonScope } from '../scopes';
import { createArray, getAllKeys, isClassProvider, isClassicProvider, isExistingProvider, isFactoryProvider, isValueProvider, isInjectionToken } from '../utils';

import type { Injector } from './injector';
import type { Session } from './session';
import type { 
  ProviderToken, ProviderType, ProviderDefinition, ProviderAnnotations, 
  InjectionHook, HookRecord, ConstraintDefinition, 
  InjectionItem, PlainInjectionItem, Injections, InjectionAnnotations, InjectionMetadata, InjectionArgument, InjectionArguments, InjectableDefinition,
  FactoryDefinition, FactoryDefinitionClass, FactoryDefinitionFactory, FactoryDefinitionValue, InjectorScope, ClassType,
} from '../interfaces';

export function processProvider<T>(host: Injector, original: ProviderType<T>): { provider: ProviderRecord, definition: ProviderDefinition | undefined } | undefined {
  let provider: Provider;
  let definition: ProviderDefinition;
  let annotations: ProviderAnnotations

  // handle provider defined as class
  if (typeof original === "function") {
    const injectableDefinition = ensureInjectable(original);
    if (!injectableDefinition) {
      return;
    }

    const { options, injections } = injectableDefinition;
    provider = getOrCreateProvider(host, original);
    annotations = options.annotations || {};

    const factory = { resolver: resolverClass, data: { class: original, inject: injections } } as FactoryDefinitionClass;
    definition = { provider, original, kind: ProviderKind.CLASS, factory, scope: options.scope || DefaultScope, when: undefined, hooks: options.hooks || [], annotations, values: new Map(), meta: {} };
  } else {
    let token = original.provide,
      factory: FactoryDefinition,
      kind: ProviderKind,
      scope = original.scope || DefaultScope,
      hooks = createArray(original.hooks),
      when = original.when;

    provider = getOrCreateProvider(host, token);
    annotations = original.annotations || {};

    if (isFactoryProvider(original)) {
      kind = ProviderKind.FACTORY;
      const inject = convertDependencies(original.inject || [], { kind: InjectionKind.FACTORY, function: original.useFactory });
      factory = { resolver: resolverFactory, data: { factory: original.useFactory, inject } } as FactoryDefinitionFactory;
    } else if (isValueProvider(original)) {
      kind = ProviderKind.VALUE;
      scope = SingletonScope;
      factory = { resolver: resolverValue, data: { value: original.useValue } } as FactoryDefinitionValue;
    } else if (isClassProvider(original)) {
      kind = ProviderKind.CLASS;
      const clazz = original.useClass;
      const definition = ensureInjectable(clazz);
      if (definition) {
        const options = definition.options;
        scope = scope || options.scope;
        // if (defScope && !defScope.kind.canBeOverrided({} as any, defScope.options)) { // TODO: fix first argument to the `canBeOverrided` function
        //   scope = defScope;
        // }
        annotations = { ...options.annotations, ...annotations }
      }

      const inject = overrideDependencies(definition?.injections, original.inject);
      factory = { resolver: resolverClass, data: { class: clazz, inject } } as FactoryDefinitionClass;
    } else if (isClassicProvider(original)) {
      // TODO...
    } else if (isExistingProvider(original)) {
      kind = ProviderKind.ALIAS;
      scope = DefaultScope;
      hooks.push(useExistingHook(original.useExisting));
    } else if (isHook(hooks)) {
      // standalone hooks - injector hooks
      if (!token) {
        addHook(host, hooks, when, annotations);
        return;
      }
      // standalone hooks on provider level
      addHook(provider, hooks, when, annotations);
      return { provider, definition: undefined };
    }

    definition = { provider, original, kind, factory, scope, when, hooks, annotations, values: new Map(), meta: {} };
  }

  handleProviderAnnotations(provider, definition, annotations);
  provider.defs.push(definition);
  provider.defs.sort(compareOrder);
  return { provider, definition };
}

function handleProviderAnnotations(provider: ProviderRecord, definition: ProviderDefinition, annotations: ProviderAnnotations) {
  if (typeof annotations.order !== 'number') {
    annotations.order = 0;
  }
  if (getAllKeys(annotations).length === 1) {
    return;
  }

  if (annotations.eager) {
    processProvider(provider.host, {
      provide: INITIALIZERS, 
      useExisting: provider.token,
      hooks: [useExistingDefinitionHook(definition)],
    });
  }

  if (annotations.component) {
    definition.hooks.push(useComponentHook);
    concatConstraints(definition, when.visible('private'));
  }

  if (annotations.visible) {
    concatConstraints(definition, when.visible(annotations.visible));
  }

  if (annotations.aliases) {
    annotations.aliases.forEach(alias => {
      processProvider(provider.host, {
        provide: alias, 
        useExisting: provider.token,
        hooks: [useExistingDefinitionHook(definition)],
      });
    })
  }
}

export function filterHooks(hooks: Array<HookRecord>, session: Session): Array<InjectionHook> {
  const satisfied: Array<InjectionHook> = [];
  if (hooks.length === 0) {
    return satisfied;
  } 

  hooks.forEach(hook => hook.when(session) && satisfied.push(hook.hook));
  return satisfied;
}

function addHook(
  obj: { hooks: Array<HookRecord> },
  hooks: Array<InjectionHook>,
  constraint: ConstraintDefinition = when.always,
  annotations: ProviderAnnotations = {},
): void {
  if (typeof annotations.order !== 'number') {
    annotations.order = 0;
  }

  hooks.forEach(hook => obj.hooks.push({
    hook,
    when: constraint,
    annotations,
  }));
  obj.hooks.sort(compareOrder);
}

function concatConstraints(definition: ProviderDefinition, constraint: ConstraintDefinition) {
  definition.when = definition.when ? when.and(constraint, definition.when) : constraint;
}

export function compareOrder(a: { annotations: ProviderAnnotations }, b: { annotations: ProviderAnnotations }): number {
  return (a.annotations['adi:order'] || 0) - (b.annotations['adi:order'] || 0);
}

function ensureInjectable(token: InjectableDefinition['token']): InjectableDefinition | undefined {
  const definition = injectableDefinitions.get(token)
  if (definition && !definition.init) {
    injectableMixin(token);
  }
  return definition;
}

export function getTreeshakableProvider(token: InjectableDefinition['token'], injector: Injector): ProviderRecord | null {
  const definition = ensureInjectable(token);
  if (!definition) {
    return null;
  }

  let provideIn = definition.options.provideIn;
  if (!provideIn) {
    return null;
  }

  provideIn = (Array.isArray(provideIn) ? provideIn : [provideIn]) as Array<InjectorScope>;
  if (!isProviderInInjectorScope(injector.options.scopes, provideIn)) {
    return null;
  }

  // if class
  if (typeof token === 'function') {
    return processProvider(injector, token as ClassType).provider;
  }

  const options = definition.options;
  return processProvider(injector, {
    provide: token,
    ...definition.options.provide || {},
    hooks: options.hooks,
    annotations: options.annotations,
  } as any).provider;
}

function isProviderInInjectorScope(scopes: Array<InjectorScope>, provideIn: Array<InjectorScope>): boolean {
  return provideIn.some(scope => scopes.includes(scope));
}

export function serializeInjectArguments<T = any>(token?: ProviderToken<T>): PlainInjectionItem<T>;
export function serializeInjectArguments<T = any>(hook?: InjectionHook): PlainInjectionItem<T>;
export function serializeInjectArguments<T = any>(hooks?: Array<InjectionHook>): PlainInjectionItem<T>;
export function serializeInjectArguments<T = any>(annotations?: InjectionAnnotations): PlainInjectionItem<T>;
export function serializeInjectArguments<T = any>(token?: ProviderToken<T>, hook?: InjectionHook): PlainInjectionItem<T>;
export function serializeInjectArguments<T = any>(token?: ProviderToken<T>, hooks?: Array<InjectionHook>): PlainInjectionItem<T>;
export function serializeInjectArguments<T = any>(token?: ProviderToken<T>, annotations?: InjectionAnnotations): PlainInjectionItem<T>;
export function serializeInjectArguments<T = any>(hook?: InjectionHook, annotations?: InjectionAnnotations): PlainInjectionItem<T>;
export function serializeInjectArguments<T = any>(hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations): PlainInjectionItem<T>;
export function serializeInjectArguments<T = any>(token?: ProviderToken<T>, hook?: InjectionHook, annotations?: InjectionAnnotations): PlainInjectionItem<T>;
export function serializeInjectArguments<T = any>(token?: ProviderToken<T>, hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations): PlainInjectionItem<T>;
export function serializeInjectArguments<T = any>(token?: ProviderToken<T> | InjectionHook | Array<InjectionHook> | InjectionAnnotations, hooks?: InjectionHook | Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations): PlainInjectionItem<T>;
export function serializeInjectArguments<T = any>(token?: ProviderToken<T> | InjectionHook | Array<InjectionHook> | InjectionAnnotations, hooks?: InjectionHook | Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations): PlainInjectionItem<T> {
  if (typeof token === 'object' && !isInjectionToken(token)) { // case with one argument
    if (isHook(token)) { // hooks
      annotations = hooks as InjectionAnnotations;
      hooks = createArray(token);
    } else {
      annotations = token as InjectionAnnotations;
    }
    token = undefined;
  } else if (typeof hooks === 'object' && !isHook(hooks)) { // case with two arguments
    annotations = hooks as InjectionAnnotations;
    hooks = [];
  }
  annotations = annotations || {};
  return { token: token as ProviderToken, hooks: hooks as Array<InjectionHook>, annotations };
}

export function convertDependency<T>(dependency: InjectionItem<T>, metadata: InjectionMetadata): InjectionArgument<T> {
  // hooks case
  if (Array.isArray(dependency)) {
    return createInjectionArgument(undefined, dependency, metadata);
  }

  // plain injection case
  const plainDep = dependency as PlainInjectionItem;
  if (plainDep.token !== undefined) {
    return createInjectionArgument(plainDep.token, plainDep.hooks, metadata);
  }

  // standalone token case
  return createInjectionArgument(dependency as ProviderToken, undefined, metadata);
}

export function convertDependencies(dependencies: Array<InjectionItem>, metadata: Omit<InjectionMetadata, 'index'>): InjectionArgument[] {
  const converted: InjectionArgument[] = [];
  for (let i = 0, l = dependencies.length; i < l; i++) {
    converted.push(convertDependency(dependencies[i], { ...metadata, index: i }));
  }
  return converted;
}

export function createInjectionArgument<T>(token: ProviderToken<T>, hooks: InjectionHook | Array<InjectionHook> = [], metadata?: InjectionMetadata): InjectionArgument<T> {
  if (!Array.isArray(hooks)) {
    hooks = [hooks];
  }
  return { token, hooks, metadata: createInjectionMetadata(metadata) };
}

export function createInjectionMetadata<T>(metadata: InjectionMetadata = {} as any): InjectionMetadata {
  return {
    kind: InjectionKind.UNKNOWN,
    target: undefined,
    key: undefined,
    index: undefined,
    descriptor: undefined,
    static: undefined,
    annotations: undefined,
    ...metadata
  }
}

export function overrideDependencies(
  original: Array<InjectionArgument>,
  overriding: Array<InjectionItem>,
): Array<InjectionArgument>;
export function overrideDependencies(
  original: InjectionArguments,
  overriding: Array<InjectionItem>,
): InjectionArguments
export function overrideDependencies(
  original: InjectionArguments,
  overriding: Injections,
): InjectionArguments
export function overrideDependencies(
  original: Array<InjectionArgument> | InjectionArguments,
  overriding: Array<InjectionItem> | Injections,
): InjectionArguments
export function overrideDependencies(
  original: Array<InjectionArgument> | InjectionArguments,
  overriding: Array<InjectionItem> | Injections,
): InjectionArguments | Array<InjectionArgument> {
  if (!overriding) {
    return original;
  }
}

export function getHostInjector(session: Session): Injector | undefined {
  if (session.parent) return session.parent.context.provider.host;
  if (session.iMetadata.kind === InjectionKind.STANDALONE) return session.iMetadata.target as Injector;
  return;
}

const useExistingHook = createHook((token: ProviderToken) => {
  return (session, next) => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    const context = session.context;
    context.provider = context.definition = undefined;
    session.iOptions.token = token;
    return resolveProvider(session);
  }
}, { name: 'adi:hook:use-existing' });

const useComponentHook = createHook(() => {
  return (session, next) => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    if (session.parent || getHostInjector(session) !== session.context.injector) {
      throw new ComponentProviderError();
    }
    return next(session);
  }
}, { name: 'adi:hook:use-component' })();

const useExistingDefinitionHook = createHook((definition: ProviderDefinition) => {
  return (session, next) => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    const context = session.context;
    session.iOptions.token = (context.provider = (context.definition = definition).provider).token;
    return resolveProvider(session);
  }
}, { name: 'adi:hook:use-existing-definition' });
