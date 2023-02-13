import { injectableDefinitions, injectableMixin } from './injectable';
import { Provider as ProviderRecord, getOrCreateProvider, Provider } from './provider';
import { resolveProvider, resolverClass, resolverFactory, resolveClassProvider, resolverValue } from './resolver';
import { ADI } from '../adi';
import { INITIALIZERS } from '../constants';
import { when } from '../constraints';
import { ProviderKind, InjectionKind } from '../enums';
import { createHook, isHook } from '../hooks';
import { ComponentProviderError } from '../problem';
import { DefaultScope } from '../scopes';
import { createArray, getAllKeys, isClassProvider, isExistingProvider, isFactoryProvider, isClassFactoryProvider, isValueProvider, isInjectionToken } from '../utils';

import type { Injector } from './injector';
import type { Session } from './session';
import type { 
  ProviderToken, ProviderType, ProviderDefinition, ProviderAnnotations, 
  InjectionHook, HookRecord, ConstraintDefinition, 
  InjectionItem, PlainInjectionItem, Injections, InjectionAnnotations, InjectionMetadata, InjectionArgument, InjectionArguments, InjectableDefinition,
  FactoryDefinition, FactoryDefinitionClass, FactoryDefinitionFactory, FactoryDefinitionValue, InjectorScope, ClassType, ClassProvider,
  OnProviderCreateEvent,
} from '../interfaces';

type ProcessProviderResult = OnProviderCreateEvent | undefined;

export function processProviders<T>(host: Injector, providers: Array<ProviderType<T>>): Array<ProcessProviderResult> {
  const processed: Array<ProcessProviderResult> = [];
  providers.forEach(provider => {
    const result = processProvider(host, provider);
    result && processed.push(result);
  });

  ADI.emitAll('provider:create', processed);
  return processed;
}

// TODO: Return add definition from hook provider and return ProcessProviderResult from standalone hooks
export function processProvider<T>(injector: Injector, original: ProviderType<T>): ProcessProviderResult {
  let provider: Provider;
  let definition: ProviderDefinition;
  let annotations: ProviderAnnotations

  // handle provider defined as class
  if (typeof original === "function") {
    const injectableDefinition = ensureInjectable(original);
    if (!injectableDefinition) {
      return;
    }

    // TODO: Handle options.provide;
    const { options, injections } = injectableDefinition;
    provider = getOrCreateProvider(injector, original);
    annotations = options.annotations || {};

    const hooks = createArray(options.hooks);
    const factory = { resolver: resolverClass, data: { class: original, inject: injections } } as FactoryDefinitionClass;

    definition = { provider, original, kind: ProviderKind.CLASS, factory, scope: options.scope || DefaultScope, when: undefined, hooks, annotations, values: new Map(), meta: {} };
  } else {
    let token = original.provide,
      factory: FactoryDefinition,
      kind: ProviderKind,
      scope = (original as ClassProvider).scope || DefaultScope,
      hooks = createArray((original as ClassProvider).hooks),
      when = (original as ClassProvider).when;

    if (!token) {
      // standalone hooks - injector hooks
      if (isHook(hooks)) {
        addHook(injector, hooks, when, annotations);
      }
      return;
    }

    provider = getOrCreateProvider(injector, token);
    annotations = (original as ClassProvider).annotations || {};

    if (isFactoryProvider(original)) {
      kind = ProviderKind.FACTORY;
      const inject = convertInjections(original.inject || [], { kind: InjectionKind.FACTORY, function: original.useFactory });
      factory = { resolver: resolverFactory, data: { factory: original.useFactory, inject } } as FactoryDefinitionFactory;
    } else if (isValueProvider(original)) {
      kind = ProviderKind.VALUE;
      // scope = SingletonScope;
      factory = { resolver: resolverValue, data: { value: original.useValue } } as FactoryDefinitionValue;
    } else if (isClassProvider(original)) {
      kind = ProviderKind.CLASS;
      const clazz = original.useClass;
      const definition = ensureInjectable(clazz);
      if (definition) {
        const options = definition.options;
        scope = scope || options.scope;
        annotations = { ...options.annotations, ...annotations };
      }

      const inject = overrideInjections(definition?.injections, original.inject, clazz);
      factory = { resolver: resolverClass, data: { class: clazz, inject } } as FactoryDefinitionClass;
    } else if (isClassFactoryProvider(original)) {
      kind = ProviderKind.PROVIDER;
      const clazz = original.useFactory;
      const definition = ensureInjectable(clazz);
      if (definition) {
        const options = definition.options;
        scope = scope || options.scope;
        annotations = { ...options.annotations, ...annotations };
      }

      const inject = overrideInjections(definition?.injections, original.inject, clazz);
      factory = { resolver: resolveClassProvider, data: { class: clazz, inject } } as FactoryDefinitionClass;
    } else if (isExistingProvider(original)) {
      kind = ProviderKind.ALIAS;
      scope = DefaultScope;
      hooks.push(useExistingHook(original.useExisting));
    } else if (isHook(hooks)) {
      // standalone hooks on provider level
      addHook(provider, hooks, when, annotations);
      return { injector, original, provider, definition: undefined };
    }

    definition = { provider, original, kind, factory, scope, when, hooks, annotations, values: new Map(), meta: {} };
  }

  handleProviderAnnotations(provider, definition, annotations);
  provider.defs.push(definition);
  provider.defs.sort(compareOrder);
  return { injector, original, provider, definition };
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

export function addHook(
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
  return (a.annotations.order || 0) - (b.annotations.order || 0);
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
  if (isHook(token)) { // case with one argument
    annotations = hooks as InjectionAnnotations;
    hooks = token;
    token = undefined;
  } else if (typeof token === 'object' && !isInjectionToken(token)) {
    annotations = token as InjectionAnnotations;
    token = undefined;
  } else if (!isHook(hooks)) { // case with two arguments
    annotations = hooks as InjectionAnnotations;
    hooks = [];
  }
  annotations = annotations || {};
  return { token: token as ProviderToken, hooks: createArray(hooks) as Array<InjectionHook>, annotations };
}

export function convertInjection<T>(dependency: InjectionItem<T>, metadata: InjectionMetadata): InjectionArgument<T> {
  // hooks case
  if (isHook(dependency)) {
    return createInjectionArgument(undefined, dependency, metadata);
  }
  // provide token case
  if (typeof dependency !== 'object' || isInjectionToken(dependency)) {
    return createInjectionArgument(dependency, undefined, metadata);
  }
  // plain injection case
  return createInjectionArgument(dependency.token, dependency.hooks, metadata, dependency.annotations);
}

export function convertInjections(dependencies: Array<InjectionItem>, metadata: Omit<InjectionMetadata, 'index'>): InjectionArgument[] {
  const converted: InjectionArgument[] = [];
  dependencies.forEach((dependency, index) => converted.push(convertInjection(dependency, { ...metadata, index })));
  return converted;
}

export function createInjectionArgument<T>(token: ProviderToken<T>, hooks: InjectionHook | Array<InjectionHook> = [], metadata?: InjectionMetadata, annotations?: InjectionAnnotations): InjectionArgument<T> {
  if (!Array.isArray(hooks)) {
    hooks = [hooks];
  }
  return { token, hooks, metadata: createInjectionMetadata(metadata, annotations) };
}

export function createInjectionMetadata<T>(metadata: InjectionMetadata = {} as any, annotations: InjectionAnnotations = {}): InjectionMetadata {
  return {
    kind: InjectionKind.UNKNOWN,
    target: undefined,
    key: undefined,
    index: undefined,
    descriptor: undefined,
    function: undefined,
    static: false,
    annotations,
    ...metadata
  }
}

export function overrideInjections(
  original: InjectionArguments,
  overriding: Array<InjectionItem> | Injections,
  target: Function,
): InjectionArguments {
  if (!overriding) {
    return original;
  }

  const newInjections: InjectionArguments = {
    parameters: [...original.parameters],
    properties: { ...original.properties },
    methods: { ...original.methods },
  };

  if (Array.isArray(overriding)) {
    newInjections.parameters = overrideArrayInjections(newInjections.parameters, overriding, { kind: InjectionKind.PARAMETER, target });
    return newInjections;
  }

  const { parameters, static: _static } = overriding;
  if (parameters) {
    newInjections.parameters = overrideArrayInjections(newInjections.parameters, parameters, { kind: InjectionKind.PARAMETER, target });
  }

  overridePropertiesAndMethodsInjections(newInjections, overriding, target, true);
  if (_static) {
    overridePropertiesAndMethodsInjections(newInjections.static, _static, target, true);
  }

  return newInjections;
}

function overrideArrayInjections(
  injections: Array<InjectionArgument>,
  overriding: Array<InjectionItem>,
  metadata: InjectionMetadata = {} as any,
): Array<InjectionArgument> {
  const newInjections = [...injections];
  overriding.forEach((override, index) => {
    if (override) {
      newInjections[index] = convertInjection(override, { ...metadata, index });
    }
  });
  return newInjections;
}

function overridePropertiesAndMethodsInjections(
  injections: Pick<InjectionArguments, 'properties' | 'methods'>,
  overriding: Pick<Injections, 'properties' | 'methods'>,
  target: Function,
  isStatic: boolean = false,
) {
  const { properties, methods } = overriding;
  const descriptorTarget = isStatic ? target : target.prototype;

  if (properties) {
    const metadata = createInjectionMetadata({
      kind: InjectionKind.PROPERTY,
      target,
      static: isStatic,
    });
    getAllKeys(properties).forEach(property => {
      const descriptor = Object.getOwnPropertyDescriptor(descriptorTarget, property);
      injections.properties[property] = convertInjection(properties[property], { ...metadata, target, key: property, descriptor });
    });
  }
  if (methods) {
    const metadata = createInjectionMetadata({
      kind: InjectionKind.PARAMETER,
      target,
      static: isStatic,
    });
    getAllKeys(methods).forEach(method => {
      const descriptor = Object.getOwnPropertyDescriptor(descriptorTarget, method);
      injections.methods[method] = overrideArrayInjections(injections.methods[method], methods[method], { ...metadata, target, key: method, descriptor });
    });
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
