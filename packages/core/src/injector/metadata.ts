import { ADI } from '../adi';
import { injectableDefinitions, injectableMixin } from './injectable';
import { getOrCreateProvider } from './provider';
import { resolverClass, resolverFactory, resolveClassicProvider, resolverValue } from './resolver';
import { INITIALIZERS } from '../constants';
import { when, whenExported, whenComponent } from '../constraints';
import { ProviderKind, InjectionKind, InjectorStatus } from '../enums';
import { isInjectionHook, UseExistingHook, UseExistingDefinitionHook } from '../hooks/private';
import { DefaultScope } from '../scopes';
import { createArray, getAllKeys, isClassProvider, isExistingProvider, isFactoryProvider, isClassFactoryProvider, isValueProvider, isInjectionToken } from '../utils';
import { cacheMetaKey, exportedToInjectorsMetaKey, definitionInjectionMetadataMetaKey, ADI_INJECTION_ITEM } from '../private';

import type { Injector } from './injector';
import type { Session } from './session';
import type { 
  ProviderToken, ProviderType, ProviderRecord, ProviderDefinition, ProviderAnnotations, ProviderHookAnnotations,
  InjectionHook, InjectionHookRecord, ConstraintDefinition,
  InjectionItem, PlainInjectionItem, Injections, InjectionAnnotations, InjectionMetadata, InjectionArgument, InjectionArguments, InjectableDefinition,
  FactoryDefinition, FactoryDefinitionClass, FactoryDefinitionFactory, FactoryDefinitionValue, InjectorScope, ClassProvider,
  OnProviderAddPayload,
} from '../types';
import { InjectionToken } from '../tokens';

export function processProviders<T>(host: Injector, providers: Array<ProviderType<T>>): Array<OnProviderAddPayload | undefined> {
  const processed: Array<OnProviderAddPayload> = [];
  providers.forEach(provider => {
    const result = processProvider(host, provider);
    if (result) {
      processed.push(result);
    }
  });

  ADI.emitAll('provider:add', processed, { injector: host });
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
  let defs: ProviderDefinition[];

  if (typeof original === "function") {
    const injectableDefinition = ensureInjectable(original);
    if (!injectableDefinition) {
      return;
    }

    const { options, injections } = injectableDefinition;
    token = original;
    provider = getOrCreateProvider(injector, original);
    annotations = options.annotations || {};
    definitionName = options.name;
    
    defs = provider.defs;
    if (checkExistingDefinition(defs, definitionName)) {
      return;
    }

    const hooks = createArray(options.hooks);
    if (options.provide) {
      return processProvider(injector, {
        ...options.provide,
        provide: original,
        hooks,
        annotations,
      });
    }

    injectionMetadata = { kind: InjectionKind.UNKNOWN, target: original };
    const factory = { resolver: resolverClass, data: { class: original, inject: injections } } as FactoryDefinitionClass;

    definition = { provider, original, name: definitionName, kind: ProviderKind.CLASS, factory, scope: options.scope || DefaultScope, when: undefined, hooks, annotations, values: new Map(), default: true, meta: {} };
  } else if (isInjectionToken(original)) {
    const injectableDefinition = ensureInjectable(original);
    if (!injectableDefinition) {
      return;
    }

    token = original;
    const options = injectableDefinition.options;
    return processProvider(injector, {
      provide: original,
      hooks: options.hooks,
      annotations: options.annotations,
      ...options.provide || {},
    })
  } else {
    annotations = original.annotations || {};
    definitionName = original.name;

    // TODO: add error in dev env 
    token = original.provide!;
    let factory: FactoryDefinition,
      kind: ProviderKind,
      scope = (original as ClassProvider).scope,
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

    provider = getOrCreateProvider(injector, token);
    defs = provider.defs;
    if (checkExistingDefinition(defs, definitionName)) {
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
        factory = { resolver: resolverFactory, data: { factory: fac, inject } } as FactoryDefinitionFactory;
      }
    } else if (isValueProvider(original)) {
      kind = ProviderKind.VALUE;
      factory = { resolver: resolverValue, data: original.useValue } as FactoryDefinitionValue;
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
      factory = { resolver: resolverClass, data: { class: clazz, inject } } as FactoryDefinitionClass;
    } else if (isExistingProvider(original)) {
      kind = ProviderKind.ALIAS;
      scope = DefaultScope;
      hooks.push(UseExistingHook(original.useExisting));
    } else if (isInjectionHook(hooks)) {
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

    definition = { provider, original, name: definitionName, kind, factory: factory!, scope: scope || DefaultScope, when, hooks, annotations, values: new Map(), default: when === undefined, meta: {} };
  }

  if (injectionMetadata) {
    definition.meta[definitionInjectionMetadataMetaKey] = injectionMetadata;
  }

  const providerIsExported = provider.meta[exportedToInjectorsMetaKey];
  if (providerIsExported !== undefined) {
    concatConstraints(definition, whenExported);
  }

  injector.meta[cacheMetaKey].delete(token);
  handleAnnotations(provider, definition, annotations);
  defs.push(definition);
  defs.sort(compareOrder);
  return { original, provider, definition };
}

function checkExistingDefinition(defs: ProviderDefinition[], definitionName?: string | symbol | object) {
  return definitionName !== undefined && defs.some(d => d.name === definitionName);
}

function handleAnnotations(provider: ProviderRecord, definition?: ProviderDefinition, annotations?: ProviderAnnotations) {
  if (!annotations) {
    return;
  }

  if (definition) {
    if (typeof annotations.order !== 'number') {
      annotations.order = 0;
    }

    if (annotations.eager) {
      processProvider(provider.host, {
        provide: INITIALIZERS, 
        useExisting: provider.token,
        hooks: UseExistingDefinitionHook(definition),
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
          hooks: UseExistingDefinitionHook(definition),
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
  const definition = injectableDefinitions.get(token)
  if (definition && !definition.init) {
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

  provideIn = (Array.isArray(provideIn) ? provideIn : [provideIn]) as Array<InjectorScope>;
  if (!isProviderInInjectorScope(injector.options.scopes!, provideIn)) {
    return;
  }

  // case with class
  if (typeof token === 'function') {
    return processProvider(injector, token)?.provider;
  }

  // case with injection token
  return processProvider(injector, {
    provide: token,
    hooks: options.hooks,
    annotations: options.annotations,
    ...options.provide || {},
  })?.provider;
}

function isProviderInInjectorScope(scopes: Array<InjectorScope>, provideIn: Array<InjectorScope>): boolean {
  return provideIn.some(scope => scopes.includes(scope));
}

export function parseInjectArguments<T>(token?: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, hooks: Array<InjectionHook> = []): PlainInjectionItem<T> {
  if ((token as InjectionToken)[ADI_INJECTION_ITEM]) {
    return (token as InjectionToken)[ADI_INJECTION_ITEM]
  } else if (isInjectionHook(token)) {
    hooks = [token, annotations, ...hooks] as InjectionHook[];
    token = undefined;
    annotations = {};
  } else if (typeof token === 'object' && isInjectionToken(token) === false) {
    annotations = token as InjectionAnnotations;
    hooks = [annotations, ...hooks] as InjectionHook[];
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
    return createPlainInjectionItem(undefined, undefined, createArray(item));
  }
  // provide token case
  if (typeof item !== 'object' || isInjectionToken(item)) {
    return createInjectionArgument(item);
  }
  // plain injection case
  return item || { token: undefined, annotations: {}, hooks: [] };
}

// export function serializeInjectArguments<T = any>(token?: ProviderToken<T>): PlainInjectionItem<T>;
// export function serializeInjectArguments<T = any>(hook?: InjectionHook): PlainInjectionItem<T>;
// export function serializeInjectArguments<T = any>(hooks?: Array<InjectionHook>): PlainInjectionItem<T>;
// export function serializeInjectArguments<T = any>(annotations?: InjectionAnnotations): PlainInjectionItem<T>;
// export function serializeInjectArguments<T = any>(token?: ProviderToken<T>, hook?: InjectionHook): PlainInjectionItem<T>;
// export function serializeInjectArguments<T = any>(token?: ProviderToken<T>, hooks?: Array<InjectionHook>): PlainInjectionItem<T>;
// export function serializeInjectArguments<T = any>(token?: ProviderToken<T>, annotations?: InjectionAnnotations): PlainInjectionItem<T>;
// export function serializeInjectArguments<T = any>(hook?: InjectionHook, annotations?: InjectionAnnotations): PlainInjectionItem<T>;
// export function serializeInjectArguments<T = any>(hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations): PlainInjectionItem<T>;
// export function serializeInjectArguments<T = any>(token?: ProviderToken<T>, hook?: InjectionHook, annotations?: InjectionAnnotations): PlainInjectionItem<T>;
// export function serializeInjectArguments<T = any>(token?: ProviderToken<T>, hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations): PlainInjectionItem<T>;
// export function serializeInjectArguments<T = any>(token?: ProviderToken<T> | InjectionHook | Array<InjectionHook> | InjectionAnnotations, hooks?: InjectionHook | Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations): PlainInjectionItem<T>;
// export function serializeInjectArguments<T = any>(token?: ProviderToken<T> | InjectionHook | Array<InjectionHook> | InjectionAnnotations, hooks?: InjectionHook | Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations): PlainInjectionItem<T> {
//   if (isHook(token)) { // case with one argument
//     annotations = hooks as InjectionAnnotations;
//     hooks = token;
//     token = undefined;
//   } else if (typeof token === 'object' && !isInjectionToken(token)) {
//     annotations = token as InjectionAnnotations;
//     token = undefined;
//   } else if (!isHook(hooks)) { // case with two arguments
//     annotations = hooks || {} as InjectionAnnotations;
//     hooks = [];
//   }
//   annotations = annotations || {};
//   return { token: token as ProviderToken, hooks: createArray(hooks) as Array<InjectionHook>, annotations };
// }

// export function prepareInjectArgument<T = any>(token: ProviderToken<T>): InjectionArgument<T>;
// export function prepareInjectArgument<T = any>(hook: InjectionHook): InjectionArgument<T>;
// export function prepareInjectArgument<T = any>(hooks: Array<InjectionHook>): InjectionArgument<T>;
// export function prepareInjectArgument<T = any>(token: ProviderToken<T>, hook?: InjectionHook): InjectionArgument<T>;
// export function prepareInjectArgument<T = any>(token: ProviderToken<T>, hooks?: Array<InjectionHook>): InjectionArgument<T>;
// export function prepareInjectArgument<T = any>(token: ProviderToken<T>, annotations?: InjectionAnnotations): InjectionArgument<T>;
// export function prepareInjectArgument<T = any>(hook: InjectionHook, annotations?: InjectionAnnotations): InjectionArgument<T>;
// export function prepareInjectArgument<T = any>(hooks: Array<InjectionHook>, annotations?: InjectionAnnotations): InjectionArgument<T>;
// export function prepareInjectArgument<T = any>(token: ProviderToken<T>, hook?: InjectionHook, annotations?: InjectionAnnotations): InjectionArgument<T>;
// export function prepareInjectArgument<T = any>(token: ProviderToken<T>, hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations): InjectionArgument<T>;
// export function prepareInjectArgument<T = any>(token: ProviderToken<T> | InjectionHook | Array<InjectionHook>, hooks?: InjectionHook | Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations): InjectionArgument<T> {
//   let cacheKey: any;
//   if (isHook(token)) { // case with one argument
//     annotations = hooks as InjectionAnnotations;
//     hooks = token;
//     token = undefined;
//   } else if (!isHook(hooks)) { // case with two arguments
//     if (hooks === undefined) {
//       cacheKey = token;
//     }
//     annotations = hooks as InjectionAnnotations;
//     hooks = undefined;
//   }
//   return { token: token as ProviderToken, hooks: createArray(hooks) as Array<InjectionHook>, metadata: createInjectionMetadata({ kind: InjectionKind.STANDALONE }, annotations), [cacheMetaKey]: cacheKey };
// }

export function convertInjection<T>(injectionItem: InjectionItem<T> | undefined, metadata: Partial<InjectionMetadata>): InjectionArgument<T> {
  const { token, hooks, annotations } = parseInjectionItem(injectionItem);
  return createInjectionArgument(token, annotations, hooks, metadata);
}

export function convertInjections(dependencies: Array<InjectionItem>, metadata: Omit<InjectionMetadata, 'index'>): InjectionArgument[] {
  const converted: InjectionArgument[] = [];
  dependencies.forEach((dependency, index) => converted.push(convertInjection(dependency, { ...metadata, index })));
  return converted;
}

export function createPlainInjectionItem<T>(token?: ProviderToken<T>, annotations?: InjectionAnnotations, hooks?: Array<InjectionHook<unknown, unknown>>): PlainInjectionItem<T> {
  return { token, hooks, annotations };
}

export function createInjectionArgument<T>(token?: ProviderToken<T>, annotations?: InjectionAnnotations, hooks?: Array<InjectionHook<unknown, unknown>>, metadata?: Partial<InjectionMetadata>): InjectionArgument<T> {
  return { token, hooks, metadata: createInjectionMetadata(metadata, annotations) };
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

export function overrideInjections(
  original: InjectionArguments,
  overriding: Array<InjectionItem | undefined> | Injections | undefined,
  target: Function,
): InjectionArguments;
export function overrideInjections(
  original: Array<InjectionArgument | undefined>,
  overriding: Array<InjectionItem | undefined> | undefined,
  target: Function,
): Array<InjectionArgument>;
export function overrideInjections(
  original: InjectionArguments | Array<InjectionArgument | undefined>,
  overriding: Array<InjectionItem | undefined> | Injections | undefined,
  target: Function,
): InjectionArguments | Array<InjectionArgument>;
export function overrideInjections(
  original: InjectionArguments | Array<InjectionArgument | undefined>,
  overriding: Array<InjectionItem | undefined> | Injections | undefined,
  target: Function,
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
      injections.methods[method] = overrideArrayInjections(injections.methods[method] || [], methods[method], { ...metadata, target, key: method, descriptor });
    });
  }
}

export function getHostInjector(session: Session): Injector | undefined {
  if (session.parent) return session.parent.context.provider?.host;
  if (session.metadata.kind === InjectionKind.STANDALONE) return session.context.injector;
  return;
}

function createClassInjections(): InjectionArguments {
  return {
    parameters: [],
    properties: {},
    methods: {},
  }
}
