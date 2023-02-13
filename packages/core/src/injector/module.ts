import { ADI } from '../adi';
import { Injector } from './injector';
import { INITIALIZERS, INJECTOR_CONFIG, MODULE_REF } from '../constants';
import { InjectorStatus } from '../enums';
import { createDefinition, wait, waitSequence, resolveRef, isModuleToken } from '../utils';
import { ADI_MODULE_DEF } from '../private';

import type { Provider } from './provider';
import type { ClassType, ExtendedModule, ModuleMetadata, ModuleImportType, ModuleExportType, ForwardReference, ProviderToken, ProviderType, ExportedModule } from "../interfaces";
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

interface ExtractedMetadata {
  input?: ClassType | ModuleToken;
  core?: ModuleMetadata;
  extended: Array<ModuleMetadata>;
  concatenated: Array<ModuleMetadata>;
}

interface CompiledModule {
  input: ClassType | ModuleToken;
  extracted: ExtractedMetadata;
  imports: Map<Exclude<ModuleImportType, ForwardReference | Promise<any>>, CompiledModule>;
  exports: Array<ProviderToken | ProviderType | ExportedModule>;
  injector: Injector;
  parent: CompiledModule;
  stack: Set<CompiledModule>;
}

export function initModule(injector: Injector) {
  return wait(importModule(injector, injector.input as any), _ => injector);
}

export function importModule(to: Injector, input: ModuleImportType): Injector | Promise<Injector> {
  if (to.status & InjectorStatus.PENDING) {
    return to;
  }
  to.status |= InjectorStatus.PENDING;

  if (Array.isArray(input)) {
    return wait(initInjector({ injector: to, input } as any), () => to);
  }

  return wait(
    retrieveMetadata(input),
    extracted => {
      const compiled = createCompiledModule(extracted, undefined, to);
      return wait(
        processImports(extracted, compiled),
        () => wait(
          processCompiled(compiled),
          () => wait(
            waitSequence(
              Array.from(compiled.stack.values()), 
              initInjector,
            ),
            () => to,
          ),
        ),
      )
    },
  );
}

function processCompiled(compiled: CompiledModule) {
  return wait(
    waitSequence(
      [...compiled.imports.values()],
      importedCompile => wait(
        processImports(importedCompile.extracted, importedCompile),
        () => processCompiled(importedCompile),
      ),
    ),
    () => processInjector(compiled),
  )
}

function processImports(extracted: ExtractedMetadata, parent: CompiledModule) {
  return waitSequence(
    extracted.concatenated,
    item => waitSequence(
      item.imports,
      importItem => processImport(importItem, parent),
    ),
  );
}

function processImport(importItem: ModuleImportType, parent: CompiledModule) {
  return wait(
    retrieveMetadata(importItem),
    extracted => {
      // doesn't have input - no module type (class, module token or extended module)
      if (!extracted.input) {
        return;
      }
      
      // TODO: Handle case when import is already created in ancestors compiled modules
      let compiled = findModuleInTree(extracted.input, parent);
      if (!compiled) {
        compiled = createCompiledModule(extracted, parent);
        parent.imports.set(extracted.input, compiled);
      }
      return processExports(extracted, compiled);
    },
  )
}

// TODO: Check and handle circular references
function processExports(extracted: ExtractedMetadata, compiled: CompiledModule) {
  return waitSequence(
    extracted.concatenated,
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
        return processImports(extracted, compiled.parent);
      }
      // normal export item
      compiled.exports.push(exportItem as any);
    }
  )
}

function processInjector(compiled: CompiledModule) {
  const { input, extracted: { concatenated }, exports } = compiled;
  const parentInjector = compiled.parent?.injector;

  const injector: Injector = compiled.injector || Injector.create(input, undefined, parentInjector);
  compiled.stack.add(compiled);

  concatenated.forEach(item => {
    injector.provide(...(item.providers || []));
  });

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
    [collection.self, ...collection.imported].forEach(provider => {
      if ((provider.host === fromInjector) && (providers ? providers.includes(token) : true)) {
        importProvider(to, token, provider);
      }
    });
  });
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
    maybeModule,
    resolved => extractModuleMetadata(resolveRef(resolved) as Exclude<ModuleImportType, ForwardReference | Promise<any>>),
  );
}

function extractModuleMetadata(ref: Exclude<ModuleImportType, ForwardReference | Promise<any>>): ExtractedMetadata | Promise<ExtractedMetadata> {
  const moduleMetadata = moduleDefinitions.get(ref);
  if (moduleMetadata) {
    return { input: ref as ClassType | ModuleToken, core: moduleMetadata, extended: [], concatenated: [moduleMetadata] };
  }

  // maybe ExtendedModule case
  const extracted: ExtractedMetadata = {
    input: undefined,
    core: undefined,
    extended: [],
    concatenated: [],
  }
  return wait(
    processExtendedModule(ref as ExtendedModule, extracted),
    () => {
      extracted.extended.reverse();
      if (extracted.core) {
        extracted.concatenated.push(extracted.core);
      }
      extracted.concatenated.push(...extracted.extended); 
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
    moduleExtends,
    probablyModule => {
      const ref = resolveRef(probablyModule);
      const definition = moduleDefinitions.get(ref);
      if (definition) {
        extracted.core = definition;
        return extracted.input = ref as ClassType | ModuleToken;
      }
      return processExtendedModule(ref as ExtendedModule, extracted);
    }
  );
}

function createCompiledModule(extracted: ExtractedMetadata, parent?: CompiledModule, injector?: Injector): CompiledModule {
  const stack = parent?.stack || new Set();
  return { input: extracted.input, extracted, imports: new Map(), exports: [], injector, parent, stack };
}

function findModuleInTree(input: ExtractedMetadata['input'], parent: CompiledModule): CompiledModule | undefined {
  if (!input) {
    return;
  }

  while (parent) {
    if (parent.input === input) {
      return parent;
    }

    const maybeImport = parent.imports.get(input);
    if (maybeImport) {
      return maybeImport;
    }

    parent = parent.parent;
  }
}

function initInjector({ injector, input }: CompiledModule) {
  injector.status |= InjectorStatus.INITIALIZED;
  ADI.emit('module:create', { injector, original: input });

  return wait(
    injector.get(INITIALIZERS),
    () => wait(
      loadModuleConfig(injector),
      () => injector.get(MODULE_REF),
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
