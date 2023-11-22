import { ADI } from '../adi';
import { Injector } from './injector';
import { concatConstraints } from './metadata';
import { whenExported } from '../constraints';
import { INITIALIZERS, INJECTOR_OPTIONS, MODULE_DEF, MODULE_REF } from '../constants';
import { InjectorStatus } from '../enums';
import { All, Optional } from '../hooks';
import { createDefinition, wait, waitSequence, resolveRef, isInjectionToken, PromisesHub, isModuleToken, isExtendedModule } from '../utils';
import { ADI_MODULE_DEF, exportedToInjectorsMetaKey, scopedInjectorLabelMetaKey, scopedInjectorsMetaKey } from '../private';
import { EventEmitter } from '../services/emitter.service';

import type { ClassType, ExtendedModule, ModuleMetadata, ModuleImportType, ModuleExportType, ForwardReference, ProviderToken, ProviderType, ExportedModule, ExportedProvider, ProviderRecord, InjectorInput, InjectorScope, InjectorOptions, ModuleDef } from "../types";
import type { InjectionToken, ModuleToken } from '../tokens';

type ExtractedModuleImportType = Exclude<ModuleImportType, ForwardReference<any> | Promise<any>>;

interface ExtractedMetadata {
  input?: ClassType | ModuleToken;
  core?: ModuleMetadata;
  extended: Array<ModuleMetadata>;
  all: Array<ModuleMetadata>;
}

interface CompiledModule {
  input: ClassType | ModuleToken;
  extracted: ExtractedMetadata;
  proxy: CompiledModule | Injector | undefined;
  imports: Map<ExtractedModuleImportType, CompiledModule>;
  compiled: Array<CompiledModule>;

  // normal exports (without exported modules)
  exports: Array<ProviderToken | ProviderType | ExportedModule>;
  injector?: Injector;
  parent: CompiledModule | Injector | undefined | null;
  stack: Set<CompiledModule>;
  shouldProcess: boolean;
}

export const moduleDefinitions = createDefinition<ModuleMetadata>(ADI_MODULE_DEF, moduleFactory);

export function moduleMixin(token: ClassType, metadata?: ModuleMetadata): ModuleMetadata {
  const definition = moduleDefinitions.ensure(token);
  Object.assign(definition, token[MODULE_DEF] || {});
  Object.assign(definition, metadata || {});
  return definition;
}

function moduleFactory(): ModuleMetadata {
  return {
    imports: [],
    providers: [],
    exports: [],
  };
}

export function extendsModule<T>(toExtend: ClassType<T> | ModuleToken | Promise<ClassType<T> | ModuleToken>, metadata: ModuleMetadata): ExtendedModule {
  return {
    extends: toExtend,
    ...metadata
  }
}

export function createInjector(
  injectorTypeOf: typeof Injector,
  input: InjectorInput,
  options: InjectorOptions,
  parent: Injector | Promise<Injector> | null,
) {
  let inputToken: any;
  let moduleDef: ModuleMetadata | undefined;
  const providers: ProviderType[] = [];
  
  if (typeof input === 'function' || isModuleToken(input)) { // module class
    moduleDef = moduleDefinitions.get(input)
    inputToken = input;
    if (typeof input === 'function') {
      providers.push(input, { provide: MODULE_REF, useExisting: input });
    } else {
      providers.push({ provide: MODULE_REF, useValue: input });
    }
  } else if (Array.isArray(input)) { // array of providers
    providers.push({ provide: MODULE_REF, useValue: input }, ...input);
  } else if (isExtendedModule(input)) { // object module
    const deepModule = retrieveDeepExtendedModule(input);
    if (typeof deepModule === 'function' || isModuleToken(deepModule)) {
      moduleDef = moduleDefinitions.get(deepModule)
      inputToken = deepModule;
      if (typeof deepModule === 'function') {
        providers.push(deepModule, { provide: MODULE_REF, useExisting: deepModule });
      } else {
        providers.push({ provide: MODULE_REF, useValue: deepModule });
      }
    } else {
      // TODO... throw error
    }
  } else { // module metadata
    providers.push({ provide: MODULE_REF, useValue: input });
  }

  let inputOptions: InjectorOptions | undefined = 
    (moduleDef && moduleDef.options) ||
    (input && (input as ModuleMetadata).options)

  if (typeof inputOptions !== 'object') {
    inputOptions = {}
  }

  const defaultScopes = parent === ADI.core ? ['any', 'root'] : ['any']
  inputToken && defaultScopes.push(inputToken);
  const optionsScopes = options.scopes
  options = {
    importing: true,
    exporting: true,
    initialize: true,
    destroy: true,
    ...inputOptions || {},
    ...options,
    scopes: optionsScopes ? [...new Set([...defaultScopes, ...optionsScopes])] : defaultScopes
  }

  const injector = new (injectorTypeOf as any)(input, options, parent);
  const emitter = injector.emitter = new EventEmitter(injector)
  injector.provide(
    { provide: Injector, useValue: injector }, 
    { provide: EventEmitter, useValue: emitter },
    { provide: INJECTOR_OPTIONS, useValue: options }, 
    { provide: INITIALIZERS, hooks: [All({ imported: false }), Optional()] },
    ...providers
  );
  
  if (options.initialize) {
    initModule(injector, input as any);
  }

  return injector;
}

export function createScopedInjector(
  parent: Injector,
  inputOrLabel?: string | symbol | InjectorInput,
  maybeInput?: InjectorInput,
  maybeOptions?: InjectorOptions
) {
  let label: string | symbol | undefined;
  let input: InjectorInput | undefined;
  let options: InjectorOptions | undefined
  let scopedInjectors: Map<string | symbol, Injector> | undefined = parent.meta[scopedInjectorsMetaKey]

  if (inputOrLabel !== undefined) {
    const typeOf = typeof inputOrLabel;
    if (typeOf === 'string' || typeOf === 'symbol') {
      label = inputOrLabel as string | symbol;
      input = maybeInput
      options = maybeOptions

      const injector = scopedInjectors?.get(label) as Injector;
      if (injector) {
        if (!options?.recreate) {
          return injector;
        }

        injector.destroy()
      }
    } else {
      input = inputOrLabel as InjectorOptions
      options = maybeInput as InjectorOptions
    }
  }

  const injector = Injector.create(input || [], { exporting: false, ...options || {} }, parent);
  if (label !== undefined) {
    injector.meta[scopedInjectorLabelMetaKey] = label
    if (!scopedInjectors) {
      scopedInjectors = (parent.meta[scopedInjectorsMetaKey] = new Map<string | symbol, Injector>());
    }
    scopedInjectors.set(label, injector);
  }
  
  return injector;
}

export function importModule(to: Injector, input: InjectorInput | Promise<InjectorInput>): Injector | Promise<Injector> {
  return wait(input, result => processImportModule(to, result));
}

export function initModule(injector: Injector, input: ModuleImportType): Injector | Promise<Injector> {
  if (injector.status & InjectorStatus.INITIALIZED) {
    return injector;
  }

  if (injector.status & InjectorStatus.PENDING) {
    return PromisesHub.get(injector) || injector;
  }

  injector.status |= InjectorStatus.PENDING;
  PromisesHub.create(injector)

  return wait(
    processInitModule(injector, input, true),
    () => {
      PromisesHub.resolve(injector, injector)
      return injector;
    }
  )
}

function processInitModule(injector: Injector, input: ModuleImportType, initParent: boolean) {
  const parent = injector.parent;
  if (parent && initParent) {
    return wait(
      parent,
      inj => {
        (injector as any).parent = inj
        return wait(
          inj.init(),
          () => processInitModule(injector, input, false)
        )
      }
    )
  }

  if (Array.isArray(input)) {
    if (parent) {
      (parent as Injector).imports.set(input, injector);
    }
    return wait(
      initInjector({ injector, input } as any), 
      () => injector,
    );
  }

  return wait(
    retrieveMetadata(input),
    extracted => processModule(injector, createCompiledModule(extracted, undefined, injector)),
  );
}

function processImportModule(to: Injector, input: InjectorInput) {
  const alreadyImported = to.imports.get(input);
  if (Array.isArray(input)) {
    if (alreadyImported) {
      return alreadyImported;
    }

    const injector = Injector.create(input, to);
    to.imports.set(input, injector);
    return wait(initInjector({ injector, input } as any), () => injector);
  }

  // TODO: Optimize it
  const parentCompiled = createCompiledModule({
    input: to.input as any,
    core: undefined,
    extended: [{
      imports: [input as any]
    }],
    all: [],
  }, to.parent as Injector, to, to, false);

  return wait(
    processModule(to, parentCompiled),
    _ => Array.from(parentCompiled.stack).pop()!.injector as Injector,
  )
}

function processModule(injector: Injector, compiled: CompiledModule) {
  return wait(
    processImports(compiled),
    () => wait(
      processCompiled(compiled),
      () => wait(
        waitSequence(
          Array.from(compiled.stack.values()), 
          initInjector,
        ),
        () => injector,
      ),
    ),
  );
}

function processCompiled(compiled: CompiledModule) {
  return wait(
    waitSequence(
      compiled.compiled,
      importedCompile => wait(
        processImports(importedCompile),
        () => processCompiled(importedCompile),
      ),
    ),
    () => processInjector(compiled),
  )
}

function processImports(compiled: CompiledModule) {
  return waitSequence(
    getMetadatas(compiled),
    item => waitSequence(
      item.imports,
      importItem => processImport(importItem, compiled),
    ),
  );
}

function processImport(importItem: ModuleImportType, parent: CompiledModule) {
  return wait(
    retrieveMetadata(importItem),
    extracted => processExtractedImport(extracted, parent),
  )
}

function processExtractedImport(extracted: ExtractedMetadata, parent?: CompiledModule | Injector | null | undefined) {
  const input = extracted.input;
  if (!input) {
    return;
  }

  const compiled = createCompiledModule(extracted, parent);
  const proxy = compiled.proxy = findModuleInTree(input, parent);

  const isInjector = parent instanceof Injector;
  let parentInjector: Injector | undefined;
  if (isInjector) {
    parentInjector = proxy ? (proxy as CompiledModule).injector : parent;
  } else {
    parent?.compiled.push(compiled);
    parentInjector = proxy ? (proxy as CompiledModule).injector : parent?.injector;
  }

  const injector = compiled.injector = Injector.create(input, { initialize: false }, parentInjector as Injector);
  if (proxy) {
    injector.status |= InjectorStatus.PROXY;
  } else if (!isInjector) {
    parent?.imports.set(input, compiled);
  }

  return processExports(compiled);
}

function processExports(compiled: CompiledModule) {
  return waitSequence(
    getMetadatas(compiled),
    item => waitSequence(
      item.exports,
      exportItem => processExport(exportItem, compiled),
    ),
  );
}

function processExport(exportItem: ModuleExportType, compiled: CompiledModule) {
  return wait(
    retrieveMetadata(exportItem as any),
    extracted => {
      // case with module
      if (extracted.input) {
        return processExtractedImport(extracted, compiled.parent);
      }
      // normal export item
      compiled.exports.push(exportItem as any);
    }
  )
}

function processInjector(compiled: CompiledModule) {
  if (compiled.shouldProcess === false) {
    return;
  }

  compiled.stack.add(compiled);
  const injector = compiled.injector;
  if (!injector) {
    return;
  }

  getMetadatas(compiled).forEach(item => {
    injector.provide(...(item.providers || []));
  });

  const parent = compiled.parent;
  if (!compiled.parent) {
    return;
  }

  const { input, exports } = compiled;
  const parentInjector: Injector | undefined = (parent as CompiledModule).injector || parent as Injector;
  if (!parentInjector) {
    return;
  }

  parentInjector.imports.set(input, injector);
  exports.forEach(exportItem => processNormalExport(exportItem, injector, parentInjector));
}

function processNormalExport(exportItem: ProviderToken | ProviderType | ExportedModule | ExportedProvider, from: Injector, to: Injector): void {
  // exported module or provider
  if (typeof exportItem === 'object') {
    // from module exports case
    if ((exportItem as ExportedModule).from) {
      return processModuleExports(exportItem as ExportedModule, from, to);
    }

    // reexport case
    if ((exportItem as ExportedProvider).export) {
      return processReExports(exportItem as ExportedProvider, from, to);
    }

    // object provider case
    if ((exportItem as Exclude<ProviderType, ClassType | InjectionToken>).provide) {
      return to.provide(exportItem as Exclude<ProviderType, ClassType>);
    }
  }

  const provider = from.providers.get(exportItem as ProviderToken);
  const selfProvider = provider?.self;

  // classType provider
  if (typeof exportItem === 'function') {
    if (selfProvider) {
      return importProvider(to, exportItem, selfProvider);
    }
    return to.provide(exportItem as any);
  }
  
  // string, symbol or InjectionToken case
  if (selfProvider) {
    importProvider(to, exportItem as ProviderToken, selfProvider);
  } else if (isInjectionToken(exportItem)) {
    to.provide(exportItem);
  }
}

function processModuleExports(exportedModule: Exclude<ExportedModule, ForwardReference>, from: Injector, to: Injector) {
  const { from: fromExported, export: exportedProviders } = exportedModule;
  const fromInjector = from.imports.get(resolveRef(fromExported));
  if (!fromInjector) {
    throw Error(`Cannot export from ${module} module`);
  }

  return from.providers.forEach((collection, token) => {
    const { self, imported } = collection;

    if (self && shouldExportProvider(self, fromInjector, token, exportedProviders)) {
      importProvider(to, token, self);
    }

    if (imported) {
      imported.forEach(item => {
        if (item && shouldExportProvider(item, fromInjector, token, exportedProviders)) {
          importProvider(to, token, item);
        }
      });
    }
  });
}

function processReExports(exportedProvider: ExportedProvider, from: Injector, to: Injector) {
  const token = exportedProvider.export;
  const provider = from.providers.get(token);
  const providerToExport = provider?.self;

  if (!providerToExport) {
    throw new Error(`cannot export given token ${token as any}`)
  }
  importProvider(to, token, providerToExport, exportedProvider.names);
}

function shouldExportProvider(provider: ProviderRecord, fromInjector: Injector, token: ProviderToken, providers: ExportedModule['export']) {
  return (provider.host === fromInjector) && (providers === '*' || providers.includes(token));
}

function importProvider(to: Injector, token: ProviderToken, provider: ProviderRecord, names?: ExportedProvider['names']) {
  const hostProvider = getProvider(to, token);
  const imported = hostProvider.imported;
  if (imported && !imported.includes(provider)) {
    imported.push(provider);
  }
  exportProvider(provider, to, names);
}

function exportProvider(provider: ProviderRecord, toInjector: Injector, names: any[] | undefined) {
  let exportedToInjectors: WeakMap<Injector, any[] | true> = provider.meta[exportedToInjectorsMetaKey]
  if (!exportedToInjectors) {
    exportedToInjectors = provider.meta[exportedToInjectorsMetaKey] = new WeakMap();
  }

  const givenInjector = exportedToInjectors.get(toInjector);
  if (givenInjector) {
    // TODO: Add error if someone try to export definition when first export all definitions
    if (Array.isArray(givenInjector) && names) {
      givenInjector.push(...names);
    }
  } else {
    exportedToInjectors.set(toInjector, names || true);
    provider.defs.forEach(def => concatConstraints(def, whenExported))
  }
}

function getProvider(injector: Injector, token: ProviderToken) {
  let hostProvider = injector.providers.get(token);
  if (!hostProvider) {
    hostProvider = { self: undefined, imported: [] };
    injector.providers.set(token, hostProvider);
    return hostProvider;
  }
  if (!hostProvider.imported) {
    hostProvider.imported = [];
  }
  return hostProvider;
}

function retrieveMetadata(maybeModule: ModuleImportType) {
  return wait(
    resolveRef(maybeModule),
    resolved => extractModuleMetadata(resolved),
  );
}

function extractModuleMetadata(ref: ExtractedModuleImportType): ExtractedMetadata | Promise<ExtractedMetadata> {
  const moduleMetadata = moduleDefinitions.get(ref);
  if (moduleMetadata) {
    return { input: ref as ClassType | ModuleToken, core: moduleMetadata, extended: [], all: [moduleMetadata] };
  }

  // maybe ExtendedModule case
  const extracted: ExtractedMetadata = {
    input: undefined,
    core: undefined,
    extended: [],
    all: [],
  }

  return wait(
    processExtendedModule(ref as ExtendedModule, extracted),
    () => {
      extracted.extended.reverse();
      if (extracted.core) {
        extracted.all.push(extracted.core);
      }
      extracted.all.push(...extracted.extended);
      return extracted;
    },
  );
}

function processExtendedModule(extendedModule: ExtendedModule, extracted: ExtractedMetadata) {
  if (!extendedModule) {
    return;
  }

  extracted.extended.push(extendedModule);
  const moduleExtends = (extendedModule as ExtendedModule)?.extends;
  if (!moduleExtends) {
    return;
  }

  return wait(
    resolveRef(moduleExtends),
    maybeModule => {
      const definition = moduleDefinitions.get(maybeModule);
      if (definition) {
        extracted.core = definition;
        return extracted.input = maybeModule as ClassType | ModuleToken;
      }
      return processExtendedModule(maybeModule as ExtendedModule, extracted);
    }
  );
}

function getMetadatas({ proxy, extracted }: CompiledModule) {
  return proxy ? extracted.extended : extracted.all;
}

function createCompiledModule(extracted: ExtractedMetadata, parent?: CompiledModule | Injector | null, injector?: Injector, proxy?: CompiledModule | Injector, shouldProcess: boolean = true): CompiledModule {
  const stack: Set<CompiledModule> = parent instanceof Injector ? new Set() : parent?.stack || new Set();
  return { input: extracted.input!, extracted, proxy, imports: new Map(), compiled: [], exports: [], injector, parent, stack, shouldProcess };
}

function findModuleInTree(input: ClassType | ModuleToken, parent: Injector | null | undefined): Injector | undefined;
function findModuleInTree(input: ClassType | ModuleToken, parent: CompiledModule | undefined): CompiledModule | undefined;
function findModuleInTree(input: ClassType | ModuleToken, parent: CompiledModule | Injector | null | undefined): CompiledModule | Injector | undefined;
function findModuleInTree(input: ClassType | ModuleToken, parent: CompiledModule | Injector | null | undefined): CompiledModule | Injector | undefined {
  if (!parent || parent instanceof Injector) {
    return;
  }

  if (parent.input === input) {
    // throw error;
    throw new Error('Cannot import module to itself');
  }

  while (parent) {
    if (parent.input === input) {
      return parent;
    }
    if (parent.imports) {
      const maybeImport = parent.imports.get(input);
      if (maybeImport) {
        return maybeImport;
      }
    }
    parent = parent.parent as Injector;
  }
}

function initInjector(compiled?: CompiledModule) {
  const injector = compiled?.injector;
  if (!compiled || !injector) {
    return;
  }

  if (injector.status & InjectorStatus.INITIALIZED) {
    return;
  }

  injector.status |= InjectorStatus.INITIALIZED;
  const { input, proxy } = compiled;
  injector.emitter.emit('module:add', { original: input });

  return wait(
    injector.get(INITIALIZERS),
    () => wait(
      loadModuleConfig(injector),
      () => !proxy && injector.get(MODULE_REF),
    ),
  )
}

function loadModuleConfig(injector: Injector) {
  return wait(
    injector.get(INJECTOR_OPTIONS),
    options => {
      const injectorOptions = injector.options;
      if (options.scopes) {
        const oldScopes = injectorOptions.scopes || [];
        injectorOptions.scopes = Array.from(new Set([...oldScopes, ...options.scopes || []])) as InjectorScope[];
      }
    }
  )
}

export function retrieveDeepExtendedModule(extendedModule: ExtendedModule) {
  const possibleExtends = extendedModule.extends;
  return (possibleExtends as ExtendedModule).extends ? retrieveDeepExtendedModule(possibleExtends as ExtendedModule) : possibleExtends;
}
