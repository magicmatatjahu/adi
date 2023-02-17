import { ADI } from '../adi';
import { Injector } from './injector';
import { inject } from './resolver';
import { INITIALIZERS, INJECTOR_CONFIG, MODULE_REF } from '../constants';
import { InjectorStatus, InjectionKind } from '../enums';
import { createDefinition, wait, waitSequence, resolveRef, isModuleToken } from '../utils';
import { ADI_MODULE_DEF } from '../private';

import type { Provider } from './provider';
import type { ClassType, ExtendedModule, ModuleMetadata, ModuleImportType, ModuleExportType, ForwardReference, ProviderToken, ProviderType, ExportedModule, InjectionArgument } from "../interfaces";
import type { ModuleToken } from '../tokens';

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
  proxy: CompiledModule | undefined;
  imports: Map<ExtractedModuleImportType, CompiledModule>;
  compiled: Array<CompiledModule>;
  // normal exports (without exported modules)
  exports: Array<ProviderToken | ProviderType | ExportedModule>;
  injector: Injector;
  parent: CompiledModule;
  stack: Set<CompiledModule>;
}

export function initModule(injector: Injector) {
  return wait(importModule(injector, injector.input as any), _ => injector);
}

export function importModule(injector: Injector, input: ModuleImportType): Injector | Promise<Injector> {
  if (injector.status & InjectorStatus.PENDING) {
    return injector;
  }
  injector.status |= InjectorStatus.PENDING;

  if (Array.isArray(input)) {
    return wait(initInjector({ injector: injector, input } as any), () => injector);
  }

  return wait(
    retrieveMetadata(input),
    extracted => {
      const compiled = createCompiledModule(extracted, undefined, injector);
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
      )
    },
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

function processExtractedImport(extracted: ExtractedMetadata, parent: CompiledModule) {
  // TODO: test plain module metadata
  // doesn't have input - no module type (class, module token or extended module)
  const input = extracted.input;
  if (!input) {
    return
  }

  const compiled = createCompiledModule(extracted, parent);
  const proxy = compiled.proxy = findModuleInTree(input, parent);
  if (!proxy) {
    parent.imports.set(input, compiled);
  }
  parent.compiled.push(compiled);

  const parentInjector = proxy ? proxy.injector : parent.injector;
  compiled.injector = Injector.create(input, undefined, parentInjector);

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
  const { input, extracted: { extended, all }, proxy, exports } = compiled;
  const injector = compiled.injector;
  compiled.stack.add(compiled);

  (proxy ? extended : all).forEach(item => {
    injector.provide(...(item.providers || []));
  });

  const parentInjector = compiled.parent?.injector;
  if (!parentInjector) {
    return;
  }

  parentInjector.imports.set(input, injector);
  exports.forEach(exportItem => processNormalExport(exportItem, injector, parentInjector));
}

function processNormalExport(exportItem: ProviderToken | ProviderType | ExportedModule, from: Injector, to: Injector): void {
  // exported module or provider
  if (typeof exportItem === 'object') {
    // from module exports case
    if ((exportItem as ExportedModule).from) {
      return processModuleExports(exportItem as ExportedModule, from, to);
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

function processModuleExports(exportedModule: Exclude<ExportedModule, ForwardReference>, from: Injector, to: Injector) {
  const { from: fromExported, providers } = exportedModule;
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

function shouldExportProvider(provider: Provider, fromInjector: Injector, token: ProviderToken, providers: Array<ProviderToken> | undefined) {
  return (provider.host === fromInjector) && (!providers || providers.includes(token));
}

function importProvider(injector: Injector, token: ProviderToken, provider: Provider) {
  let hostProvider = injector.providers.get(token);
  if (!hostProvider) {
    hostProvider = { self: undefined, imported: [] };
    injector.providers.set(token, hostProvider);
  }
  (hostProvider.imported || (hostProvider.imported = [])).push(provider);
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

function getMetadatas(compiled: CompiledModule) {
  const extracted = compiled.extracted;
  return compiled.proxy ? extracted.extended : extracted.all;
}

function createCompiledModule(extracted: ExtractedMetadata, parent?: CompiledModule, injector?: Injector): CompiledModule {
  const stack = parent?.stack || new Set();
  return { input: extracted.input, extracted, proxy: undefined, imports: new Map(), compiled: [], exports: [], injector, parent, stack };
}

function findModuleInTree(input: ClassType | ModuleToken, parent: CompiledModule): CompiledModule | undefined {
  if (!input) {
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
        scopes = Array.from(new Set([...injector.options.scopes, ...options.scopes]));
      }
      Object.assign(injector.options, { ...options, scopes });
    }
  )
}

export function retrieveExtendedModule(module: ExtendedModule) {
  const _extends = module.extends;
  return (_extends as any).extends ? retrieveExtendedModule((_extends as any).extends) : _extends;
}
