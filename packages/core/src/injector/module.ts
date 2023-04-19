import { ADI } from '../adi';
import { Injector } from './injector';
import { concatConstraints } from './metadata';
import { whenExported } from '../constraints';
import { INITIALIZERS, INJECTOR_CONFIG, MODULE_REF } from '../constants';
import { InjectorStatus } from '../enums';
import { createDefinition, wait, waitSequence, resolveRef, isModuleToken } from '../utils';
import { ADI_MODULE_DEF, exportedToInjectorsMetaKey } from '../private';

import type { ClassType, ExtendedModule, ModuleMetadata, ModuleImportType, ModuleExportType, ForwardReference, ProviderToken, ProviderType, ExportedModule, ExportedProvider, ProviderRecord, InjectorInput } from "../interfaces";
import type { ModuleToken } from '../tokens';

type ExtractedModuleImportType = Exclude<ModuleImportType, ForwardReference | Promise<any>>;

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
  injector: Injector;
  parent: CompiledModule | Injector;
  stack: Set<CompiledModule>;
}

export const moduleDefinitions = createDefinition<ModuleMetadata>(ADI_MODULE_DEF, moduleFactory);

export function moduleMixin(token: ClassType | ModuleToken, metadata?: ModuleMetadata): ModuleMetadata {
  const definition = moduleDefinitions.ensure(token);
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

export function initModule(injector: Injector): Injector | Promise<Injector> {
  return wait(__importModule(injector, injector.input as any), _ => (injector as any).$ = injector);
}

export function __importModule(injector: Injector, input: ModuleImportType): Injector | Promise<Injector> {
  if (injector.status & InjectorStatus.PENDING) {
    return injector;
  }
  injector.status |= InjectorStatus.PENDING;

  if (Array.isArray(input)) {
    if (injector.parent) {
      injector.parent.imports.set(input, injector);
    }
    return wait(initInjector({ injector, input } as any), () => injector);
  }

  return wait(
    retrieveMetadata(input),
    extracted => processModule(injector, createCompiledModule(extracted, undefined, injector)),
  );
}

export function importModule(to: Injector, input: InjectorInput | Promise<InjectorInput>): Injector | Promise<Injector> {
  return wait(input, result => processImportModule(to, result));
}

function processImportModule(to: Injector, input: InjectorInput) {
  const alreadyImported = to.imports.get(input);
  if (Array.isArray(input)) {
    if (alreadyImported) {
      return alreadyImported;
    }

    const injector = Injector.create(input, undefined, to);
    to.imports.set(input, injector);
    return wait(initInjector({ injector, input } as any), () => injector);
  }

  return wait(
    retrieveMetadata(input as any),
    extracted => {
      const injector = Injector.create(extracted.input, undefined, to);
      const compiled = createCompiledModule(extracted, to, injector);
      compiled.proxy = findModuleInTree(input as any, to);
      return processModule(injector, compiled)
    }
  )
}

function processModule(injector: Injector, compiled: CompiledModule) {
  return wait(
    processExports(compiled),
    () => wait(
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
    )
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

function processExtractedImport(extracted: ExtractedMetadata, parent: CompiledModule | Injector) {
  // TODO: test plain module metadata
  // doesn't have input - no module type (class, module token or extended module)
  const input = extracted.input;
  if (!input) {
    return;
  }

  const compiled = createCompiledModule(extracted, parent);
  const proxy = compiled.proxy = findModuleInTree(input, parent);

  const isInjector = parent instanceof Injector;
  let parentInjector: Injector;
  if (isInjector) {
    parentInjector = proxy ? (proxy as CompiledModule).injector : parent;
  } else {
    parent.compiled.push(compiled);
    parentInjector = proxy ? (proxy as CompiledModule).injector : parent.injector;
  }

  const injector = compiled.injector = Injector.create(input, { initialize: false }, parentInjector);
  if (proxy) {
    injector.status |= InjectorStatus.PROXY;
  } else if (!isInjector) {
    parent.imports.set(input, compiled);
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
  const injector = compiled.injector;
  compiled.stack.add(compiled);

  getMetadatas(compiled).forEach(item => {
    injector.provide(...(item.providers || []));
  });

  const parent = compiled.parent;
  if (!compiled.parent) {
    return;
  }

  const { input, exports} = compiled;
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
    if ((exportItem as Exclude<ProviderType, ClassType>).provide) {
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
  };
}

// TODO: Handle named definition exports
function processModuleExports(exportedModule: Exclude<ExportedModule, ForwardReference>, from: Injector, to: Injector) {
  const { from: fromExported, exports: providers } = exportedModule;
  const fromInjector = from.imports.get(resolveRef(fromExported));
  if (!fromInjector) {
    throw Error(`Cannot export from ${module} module`);
  }

  return from.providers.forEach((collection, token) => {
    const { self, imported } = collection;
    if (self && shouldExportProvider(self, fromInjector, token, providers)) {
      importProvider(to, token, self);
    }
    if (imported) {
      imported.forEach(item => {
        if (item && shouldExportProvider(item, fromInjector, token, providers)) {
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

function shouldExportProvider(provider: ProviderRecord, fromInjector: Injector, token: ProviderToken, providers: ExportedModule['exports'] | undefined) {
  return (provider.host === fromInjector) && (!providers || providers.includes(token));
}

function importProvider(to: Injector, token: ProviderToken, provider: ProviderRecord, names?: ExportedProvider['names']) {
  const hostProvider = getProvider(to, token);
  const imported = hostProvider.imported;
  if (!imported.includes(provider)) {
    imported.push(provider);
  }
  exportProvider(provider, to, names);
}

function exportProvider(provider: ProviderRecord, toInjector: Injector, names?: any[]) {
  let exportedToInjectors: WeakMap<Injector, any[] | true> = provider.meta[exportedToInjectorsMetaKey]
  if (!exportedToInjectors) {
    exportedToInjectors = provider.meta[exportedToInjectorsMetaKey] = new WeakMap();
  }

  const givenInjector = exportedToInjectors.get(toInjector);
  if (givenInjector) {
    // TODO: Add error if someone try to export definition when first export all definitions
    if (givenInjector !== true) {
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

function createCompiledModule(extracted: ExtractedMetadata, parent?: CompiledModule | Injector, injector?: Injector): CompiledModule {
  const stack: Set<CompiledModule> = parent instanceof Injector ? new Set() : parent?.stack || new Set();
  return { input: extracted.input, extracted, proxy: undefined, imports: new Map(), compiled: [], exports: [], injector, parent, stack };
}

function findModuleInTree(input: ClassType | ModuleToken, parent: Injector): Injector | undefined;
function findModuleInTree(input: ClassType | ModuleToken, parent: CompiledModule): CompiledModule | undefined;
function findModuleInTree(input: ClassType | ModuleToken, parent: CompiledModule | Injector): CompiledModule | Injector | undefined;
function findModuleInTree(input: ClassType | ModuleToken, parent: CompiledModule | Injector): CompiledModule | Injector | undefined {
  if (!input || parent instanceof Injector) {
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
    parent = parent.parent;
  }
}

function initInjector({ injector, input, proxy }: CompiledModule) {
  if (injector.status & InjectorStatus.INITIALIZED) return;
  injector.status |= InjectorStatus.INITIALIZED;
  ADI.emit('module:create', { injector, original: input });

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
    injector.get(INJECTOR_CONFIG),
    options => {
      let scopes = injector.options.scopes;
      if (options.scopes) {
        scopes = Array.from(new Set([...scopes, ...options.scopes]));
      }
      Object.assign(injector.options, { ...options, scopes });
    }
  )
}

export function retrieveExtendedModule(module: ExtendedModule) {
  const _extends = module.extends;
  return (_extends as any).extends ? retrieveExtendedModule((_extends as any).extends) : _extends;
}
