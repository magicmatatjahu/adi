import { injectableDefinitions, injectableMixin } from './injectable';
import { patchMethod } from './method-injection';
import { ProviderRecord } from './provider';
import { resolveClass, resolveFactory, resolveClassicProvider, resolveValue, removeCache } from './resolver';
import { INITIALIZERS } from '../constants';
import { when, whenExported, whenComponent } from '../constraints';
import { ProviderKind, InjectionKind, InjectorStatus, InjectableStatus } from '../enums';
import { isInjectionHook, ExistingHook, AliasHook } from '../hooks/private';
import { InjectionToken } from '../tokens';
import { DefaultScope, getScopeDefinition } from '../scopes';
import { createArray, getAllKeys, isClassProvider, isExistingProvider, isFactoryProvider, isClassFactoryProvider, isValueProvider, isInjectionToken } from '../utils';
import { exportedToInjectorsMetaKey, definitionInjectionMetadataMetaKey, ADI_INJECTION_ARGUMENT, scopedInjectorsMetaKey } from '../private';

import type { Injector } from './injector';
import type { ProviderDefinition } from './provider';
import type { Session } from './session';
import type { 
  ProviderToken, ProviderType, ProviderAnnotations, ProviderHookAnnotations,
  InjectionHook, InjectionHookRecord, ConstraintDefinition,
  InjectionItem, PlainInjectionItem, Injections, InjectionAnnotations, InjectionMetadata, InjectionArgument, InjectionArguments, ParsedInjectionItem, InjectableDefinition,
  FactoryDefinition, FactoryDefinitionClass, FactoryDefinitionFactory, FactoryDefinitionValue, InjectorScope, ClassProvider,
  OnProviderAddPayload, ScopeType, ClassType,
} from '../types';

export function processProviders<T>(host: Injector, providers: Array<ProviderType<T>>): Array<OnProviderAddPayload | undefined> {
  const processed: Array<OnProviderAddPayload> = [];
  providers.forEach(provider => {
    const result = processProvider(host, provider);
    if (result) {
      processed.push(result);
    }
  });

  host.emitter.emitAll('provider:add', processed);
  return processed;
}

export function processProvider<T>(injector: Injector, original: ProviderType<T>): OnProviderAddPayload | undefined {
  if (!original) {
    return;
  }

  let token: ProviderToken<any>;
  let provider: ProviderRecord;
  let definition: ProviderDefinition;
  let definitionName: string | symbol | object | undefined;
  let injectionMetadata: InjectionMetadata | undefined;
  let annotations: ProviderAnnotations;

  if (typeof original === "function") {
    const injectableDefinition = ensureInjectable(original);
    if (!injectableDefinition) {
      return;
    }

    const { options, injections } = injectableDefinition;
    token = original;
    provider = ProviderRecord.get(original, injector);
    annotations = options.annotations || {};
    definitionName = options.name;
    
    if (checkExistingDefinition(provider.defs, definitionName)) {
      return;
    }

    const hooks = createArray(options.hooks);
    if (options.provide) {
      return processProvider(injector, {
        ...options.provide,
        provide: original,
      });
    }

    injectionMetadata = { kind: InjectionKind.UNKNOWN, target: original };
    const factory = { resolver: resolveClass, data: { class: original, inject: injections } } as FactoryDefinitionClass;

    const scope = getScopeDefinition(options.scope || DefaultScope)
    definition = provider.definition({
      original,
      kind: ProviderKind.CLASS, 
      factory, 
      scope, 
      hooks, 
      annotations,
      when: undefined,
      name: definitionName,
    });
  } else if (isInjectionToken(original)) {
    const injectableDefinition = ensureInjectable(original);
    if (!injectableDefinition) {
      return;
    }

    token = original;
    const provide = (injectableDefinition as any).provide;
    if (provide) {
      return processProvider(injector, provide as ProviderType)
    }

    throw new Error('Provide is not defined for InjectionToken')
  } else {
    annotations = original.annotations || {};
    definitionName = original.name;

    token = original.provide!;
    let factory: FactoryDefinition,
      kind: ProviderKind,
      scope: ScopeType | undefined = (original as ClassProvider).scope,
      hooks = createArray(original.hooks),
      when = original.when;

    if (token === undefined) {
      // standalone hooks - injector hooks
      if (Array.isArray(hooks)) {
        injector.status |= InjectorStatus.HAS_HOOKS
        addHook(injector, hooks, 'injector', when, annotations);
      }
      return { original };
    }

    provider = ProviderRecord.get(token, injector);
    if (checkExistingDefinition(provider.defs, definitionName)) {
      return;
    }

    if (isFactoryProvider(original)) {
      if (isClassFactoryProvider(original)) {
        kind = ProviderKind.PROVIDER;
        const clazz = original.useFactory;
        const definition = ensureInjectable(clazz);
        if (definition) {
          const options = definition.options;
          scope = scope || options.scope;
          annotations = { ...options.annotations, ...annotations };
        }
  
        injectionMetadata = { kind: InjectionKind.PARAMETER, target: clazz };
        const inject = overrideInjections(definition?.injections || createClassInjections(), original.inject, clazz);
        factory = { resolver: resolveClassicProvider, data: { class: clazz, inject } } as FactoryDefinitionClass;
      } else {
        kind = ProviderKind.FACTORY;
        const fac = original.useFactory;
        injectionMetadata = { kind: InjectionKind.FACTORY, function: fac };
        const inject = convertInjections(original.inject || [], injectionMetadata);
        factory = { resolver: resolveFactory, data: { factory: fac, inject } } as FactoryDefinitionFactory;
      }
    } else if (isValueProvider(original)) {
      kind = ProviderKind.VALUE;
      factory = { resolver: resolveValue, data: original.useValue } as FactoryDefinitionValue;
    } else if (isClassProvider(original)) {
      kind = ProviderKind.CLASS;
      const clazz = original.useClass;
      const definition = ensureInjectable(clazz);
      if (definition) {
        const options = definition.options;
        scope = scope || options.scope;
        annotations = { ...options.annotations, ...annotations };
      }

      injectionMetadata = { kind: InjectionKind.PARAMETER, target: clazz };
      const inject = overrideInjections(definition?.injections || createClassInjections(), original.inject, clazz);
      factory = { resolver: resolveClass, data: { class: clazz, inject } } as FactoryDefinitionClass;
    } else if (isExistingProvider(original)) {
      kind = ProviderKind.ALIAS;
      scope = DefaultScope;
      hooks.push(ExistingHook(original.useExisting));
    } else if (isInjectionHook(hooks[0])) {
      // standalone hooks on provider level
      addHook(provider, hooks, 'provider', when, annotations);
      return { original, provider };
    } else { // case with token provider - without definition - or custom provider
      if (token !== undefined) {
        const providerKeys = getAllKeys(original).length;
        if ( // without definition - token provider case
          (providerKeys === 2 && (when || original.annotations)) ||
          (providerKeys === 2 && (when && original.annotations))
        ) {
          concatConstraints(provider, when!);
          handleAnnotations(provider, undefined, original.annotations);
        }
      }
      // custom provider case
      return { original, provider };
    }

    const scopeDef = getScopeDefinition(scope || DefaultScope)
    definition = provider.definition({
      original,
      kind: ProviderKind.CLASS, 
      factory: factory!, 
      scope: scopeDef, 
      hooks, 
      annotations,
      when,
      name: definitionName,
    });
  }

  if (injectionMetadata) {
    definition.meta[definitionInjectionMetadataMetaKey] = injectionMetadata;
  }

  const providerIsExported = provider.meta[exportedToInjectorsMetaKey];
  if (providerIsExported !== undefined) {
    concatConstraints(definition, whenExported);
  }

  removeCache(injector, token);
  handleAnnotations(provider, definition, annotations);
  return { original, provider, definition };
}

function checkExistingDefinition(defs: ProviderDefinition[], definitionName?: string | symbol | object) {
  return definitionName && defs.some(d => d.name === definitionName);
}

function handleAnnotations(provider: ProviderRecord, definition?: ProviderDefinition, annotations?: ProviderAnnotations) {
  if (!annotations) {
    return;
  }

  if (definition) {
    if (annotations.eager) {
      processProvider(provider.host, {
        provide: INITIALIZERS, 
        useExisting: provider.token,
        hooks: AliasHook(definition),
      }); 
    }

    if (annotations.component) {
      concatConstraints(definition, whenComponent);
    }
  
    if (annotations.visible) {
      concatConstraints(definition, when.visible(annotations.visible));
    }

    if (annotations.aliases) {
      annotations.aliases.forEach(alias => {
        processProvider(provider.host, {
          provide: alias, 
          useExisting: provider.token,
          hooks: AliasHook(definition),
        });
      })
    }
  }
}

export function filterHooks(hooks: Array<InjectionHookRecord>, session: Session): Array<InjectionHook> {
  const satisfied: Array<InjectionHook> = [];
  if (hooks.length === 0) {
    return satisfied;
  } 

  hooks.forEach(hook => hook.when(session) && satisfied.push(hook.hook));
  return satisfied;
}

export function addHook(
  entry: { hooks: Array<InjectionHookRecord> },
  hooks: Array<InjectionHook>,
  kind: InjectionHookRecord['kind'],
  constraint: ConstraintDefinition = when.always,
  annotations: ProviderHookAnnotations = {},
): void {
  if (typeof annotations.order !== 'number') {
    annotations.order = 0;
  }

  // TODO: Change order of passing hooks - probably
  const entryHooks = entry.hooks;
  hooks.forEach(hook => entryHooks.push({
    kind,
    hook,
    when: constraint,
    annotations,
    meta: {},
  }));
  entryHooks.sort(compareOrder);
}

export function concatConstraints(record: { when?: ConstraintDefinition }, constraint: ConstraintDefinition) {
  if (constraint === undefined) return;
  record.when = record.when ? when.and(constraint, record.when) : constraint;
}

export function compareOrder(a: { annotations: ProviderAnnotations }, b: { annotations: ProviderAnnotations }): number {
  return (a.annotations.order || 0) - (b.annotations.order || 0);
}

function ensureInjectable(token: InjectableDefinition['token']): InjectableDefinition | undefined {
  const definition = injectableDefinitions.ensure(token)
  if ((definition.status & InjectableStatus.DEFINITION_RESOLVED) === 0) {
    injectableMixin(token);
  }
  return definition;
}

export function getTreeshakableProvider(token: InjectableDefinition['token'], injector: Injector): ProviderRecord | undefined {
  const definition = ensureInjectable(token);
  if (!definition) {
    return;
  }

  const options = definition.options;
  let provideIn = options.provideIn;
  if (!provideIn) {
    return;
  }

  provideIn = createArray(provideIn as any) as InjectorScope[]
  if (!isProviderInInjectorScope(injector.options.scopes!, provideIn)) {
    return;
  }

  return processProvider(injector, token)?.provider;
}

function isProviderInInjectorScope(scopes: Array<InjectorScope>, provideIn: Array<InjectorScope>): boolean {
  return provideIn.some(scope => scopes.includes(scope));
}

export function parseInjectArguments<T>(token?: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, hooks: Array<InjectionHook> = []): ParsedInjectionItem {
  let injectionArgument: ParsedInjectionItem | undefined
  if (token === undefined) {
    return createPlainInjectionItem(undefined);
  } else if (injectionArgument = (token as InjectionToken)[ADI_INJECTION_ARGUMENT]) {
    return injectionArgument as ParsedInjectionItem
  } else if (isInjectionHook(token)) {
    hooks = [token, annotations, ...hooks] as InjectionHook[];
    token = undefined;
    annotations = {};
  } else if (typeof token === 'object' && isInjectionToken(token) === false) {
    hooks = [annotations, ...hooks] as InjectionHook[];
    annotations = token as InjectionAnnotations;
    token = undefined;
  } else if (isInjectionHook(annotations)) {
    hooks = [annotations, ...hooks] as InjectionHook[];
    annotations = {};
  }
  return createPlainInjectionItem(token as ProviderToken, annotations, hooks.filter(Boolean));
}

export function parseInjectionItem<T>(item?: InjectionItem): PlainInjectionItem<T> {
  // hooks case
  if (isInjectionHook(item) || Array.isArray(item)) {
    return createPlainInjectionItem(undefined, {}, createArray(item));
  }
  // provide token case
  if (typeof item !== 'object' || isInjectionToken(item)) {
    return createInjectionArgument(item);
  }
  // plain injection case
  return item || { token: undefined, annotations: {}, hooks: [] };
}

export function convertInjection<T>(injectionItem: InjectionItem<T> | undefined, metadata: Partial<InjectionMetadata>): InjectionArgument<T> {
  const { token, hooks, annotations } = parseInjectionItem(injectionItem);
  return createInjectionArgument(token, annotations, hooks, metadata) as InjectionArgument<T> ;
}

export function convertInjections(dependencies: Array<InjectionItem> | undefined, metadata: Omit<InjectionMetadata, 'index'>): InjectionArgument[] {
  if (!dependencies) {
    return [];
  }

  const converted: InjectionArgument[] = [];
  dependencies.forEach((dependency, index) => converted.push(convertInjection(dependency, { ...metadata, index })));
  return converted;
}

export function createPlainInjectionItem<T>(token?: ProviderToken<T>, annotations: InjectionAnnotations = {}, hooks: Array<InjectionHook<unknown, unknown>> = []): ParsedInjectionItem {
  return { token, annotations, hooks };
}

export function createInjectionArgument<T>(token?: ProviderToken<T>, annotations: InjectionAnnotations = {}, hooks: Array<InjectionHook<unknown, unknown>> = [], metadata?: Partial<InjectionMetadata>): InjectionArgument<T> {
  return { token, annotations, hooks, metadata: createInjectionMetadata(metadata, annotations) };
}

export function createInjectionMetadata<T>(metadata?: Partial<InjectionMetadata>, annotations: InjectionAnnotations = {}): InjectionMetadata {
  return {
    kind: InjectionKind.UNKNOWN,
    target: undefined,
    key: undefined,
    index: undefined,
    descriptor: undefined,
    function: undefined,
    static: false,
    annotations,
    ...metadata || {},
  }
}

export function hasScopedInjector(injector: Injector | undefined, label: string | symbol): boolean {
  return injector?.meta[scopedInjectorsMetaKey]?.has(label) || false
}

export function overrideInjections(
  original: InjectionArguments,
  overriding: Array<InjectionItem | undefined> | Injections | undefined,
  target: Function | ClassType,
): InjectionArguments;
export function overrideInjections(
  original: Array<InjectionArgument | undefined>,
  overriding: Array<InjectionItem | undefined> | undefined,
  target: Function | ClassType,
): Array<InjectionArgument>;
export function overrideInjections(
  original: InjectionArguments | Array<InjectionArgument | undefined>,
  overriding: Array<InjectionItem | undefined> | Injections | undefined,
  target: Function | ClassType,
): InjectionArguments | Array<InjectionArgument>;
export function overrideInjections(
  original: InjectionArguments | Array<InjectionArgument | undefined>,
  overriding: Array<InjectionItem | undefined> | Injections | undefined,
  target: Function | ClassType,
): InjectionArguments | Array<InjectionArgument | undefined> {
  if (!overriding) {
    return original;
  }

  if (Array.isArray(original)) {
    if (Array.isArray(overriding)) {
      let kind: InjectionKind | undefined;
      // find first kind of injection
      original.find(inj => kind = inj?.metadata?.kind);
      return overrideArrayInjections(original, overriding, { kind: kind || InjectionKind.FACTORY, function: target as ((...args: any[]) => any) });
    }
    return original;
  }

  const newInjections: InjectionArguments = {
    parameters: [...original.parameters],
    properties: { ...original.properties },
    methods: { ...original.methods },
  };
  
  if (original.static) {
    newInjections.static = {
      properties: { ...original.static.properties },
      methods: { ...original.static.methods },
    }
  }
  
  if (Array.isArray(overriding)) {
    newInjections.parameters = overrideArrayInjections(newInjections.parameters, overriding, { kind: InjectionKind.PARAMETER, target });
    return newInjections;
  }

  const { parameters, static: oldStatic } = overriding;
  if (parameters) {
    newInjections.parameters = overrideArrayInjections(newInjections.parameters, parameters, { kind: InjectionKind.PARAMETER, target });
  }

  overridePropertiesAndMethodsInjections(newInjections, overriding, target, false);
  if (oldStatic) {
    newInjections.static = newInjections.static || { properties: {}, methods: {} };
    overridePropertiesAndMethodsInjections(newInjections.static, oldStatic, target, true);
  }

  return newInjections;
}

function overrideArrayInjections(
  injections: Array<InjectionArgument | undefined>,
  overriding: Array<InjectionItem | undefined>,
  metadata: InjectionMetadata = {} as any,
): Array<InjectionArgument | undefined> {
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
  target: Function | ClassType,
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
      injections.methods[method] = overrideArrayInjections(injections.methods[method] || [], methods[method], { ...metadata, target, key: method, descriptor });
      if (!isStatic) {
        patchMethod(target as ClassType, method)
      }
    });
  }
}

function createClassInjections(): InjectionArguments {
  return {
    parameters: [],
    properties: {},
    methods: {},
  }
}
