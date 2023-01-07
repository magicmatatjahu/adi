import { ModuleToken } from "./module-token";
import { Injector } from "./new-injector";
import { toProviderRecord } from "./metadata";
import { INITIALIZERS, INJECTOR_CONFIG, MODULE_REF } from "../constants";
import { InjectionKind, InjectorStatus } from "../enums";
import { getModuleDefinition } from "../decorators";
import { ForwardReference, resolveRef, wait, waitAll, waitCallback, waitSequence } from "../utils";

import type { ModuleMetadata, ClassType, InjectorOptions, Provider, ProviderToken, ProviderRecord, CustomProvider } from "../interfaces";

// MODULE
type ModuleID = string | symbol;

type ModuleImportItem<T = any> = 
  | ClassType
  | ModuleToken
  | DynamicModule<T>
  | Promise<ClassType>
  | Promise<DynamicModule<T>>
  | ForwardReference<ModuleImportItem<T>>;

type ModuleExportItem = 
  | ProviderToken
  | Provider
  | ExportedModule
  | ModuleToken
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference<ModuleExportItem>;

type ExportedModule = {
  from: ClassType | ForwardReference<ClassType>;
  id?: ModuleID;
  providers?: Array<ProviderToken>;
}

interface DynamicModule<T = any> extends ModuleMetadata {
  extends: ModuleImportItem<T> | ModuleMetadata;
  id?: ModuleID;
}

interface RetrievedMetadata<T = any> {
  type: ClassType<T>;
  moduleDefs: Array<ModuleMetadata>;
  coreModuleDef: ModuleMetadata;
}

type CompiledExport = ProviderToken | Provider | ExportedModule;

interface CompiledModule {
  type: ClassType | ModuleToken;
  coreModuleDef: ModuleMetadata;
  moduleDefs: Array<ModuleMetadata>;
  imports: Map<ClassType | ModuleToken, CompiledModule>;
  providers: Provider[];
  exports: Array<CompiledExport>;
  exportedImports: Map<ClassType | ModuleToken, Array<CompiledModule>>;
  injector: Injector;
  proxy: boolean;
  parent: CompiledModule;
}

export function initModule(injector: Injector) {
  return wait(importModule(injector, injector.metatype), _ => injector);
}

export function importModule(to: Injector, m: ModuleImportItem | ModuleMetadata) {
  return wait(
    retrieveMetadata(m as any),
    metadata => wait(
      processMetadatas(metadata),
      compiled => {
        compiled.injector = to;
        const stack = new Set<CompiledModule>();
        stack.add(compiled);
        processInjectors(compiled, stack);
        return initModules(stack);
      }
    ),
  );
}

function processMetadatas(retrieved: RetrievedMetadata, parent?: CompiledModule, maybeCompiled?: CompiledModule): CompiledModule | Promise<CompiledModule> {
  if (!retrieved) return;

  const { type, moduleDefs, coreModuleDef } = retrieved;
  let compiled = maybeCompiled || parent?.imports?.get(type);
  if (!compiled) {
    compiled = createCompiledModule(type, coreModuleDef, moduleDefs, parent);
    if (!findModuleInTree(compiled)) {
      parent?.imports?.set(type, compiled);
      return wait(
        processMetadata(coreModuleDef, compiled),
        _ => processMetadatas(retrieved, parent, compiled),
      );
    };
  }

  if (!moduleDefs.length) return compiled;
  return waitSequence(
    [...moduleDefs].reverse(),
    moduleDef => processMetadata(moduleDef, compiled),
    _ => compiled,
  );
}

function processMetadata(metadata: ModuleMetadata, compiled: CompiledModule) {
  compiled.providers.push(...metadata.providers || []);
  return waitSequence(
    metadata.exports,
    exportItem => wait(
      retrieveMetadata(exportItem as any),
      maybeCompiled => {
        // case with module or dynamic module
        if (maybeCompiled) {
          return processMetadatas(maybeCompiled, compiled.parent);
        }
        // normal export item
        compiled.exports.push(exportItem as any);
      }
    ),
    _ => waitSequence( // TODO: Perform operations on all imports of a given level like in old solution
      metadata.imports,
      importItem => wait(
        retrieveMetadata(importItem as any),
        importedCompiledItem => processMetadatas(importedCompiledItem, compiled),
      ),
    ),
  );
}

function processInjectors(compiled: CompiledModule, stack: Set<CompiledModule>) {
  // TODO: Think about circular references between modules
  const foundModule = findModuleInTree(compiled);
  if (foundModule && foundModule !== compiled) return;
  
  const parentInjector = compiled.parent?.injector;
  const injector = compiled.injector = compiled.injector || Injector.create(compiled.type, undefined, parentInjector);
  compiled.providers.forEach(provider => provider && toProviderRecord(compiled.injector as any, provider));

  // TODO: Add check if injector can exporting and importing
  compiled.imports.forEach(_import => stack.add(_import));
  compiled.imports.forEach(_import => processInjectors(_import, stack));

  if (!parentInjector) return;
  compiled.exports.forEach(e => processExport(e, injector, parentInjector));
}

export function processExport(compiledExport: CompiledExport, from: Injector, to: Injector): void {
  // exported module or provider
  if (typeof compiledExport === 'object') {
    // from module exports case
    if ((compiledExport as ExportedModule).from) {
      return processModuleExports(compiledExport as ExportedModule, from, to);
    }

    // custom provider case
    if ((compiledExport as CustomProvider).provide) {
      return to.provide(compiledExport as CustomProvider);
    }
  }

  const record = from.providers.get(compiledExport as ProviderToken);
  const selfRecord = record && record[0];

  // classType provider
  if (typeof compiledExport === 'function') {  
    return selfRecord ? importRecord(to, compiledExport, selfRecord) : to.provide(compiledExport as any);
  }
  // string, symbol or InjectionToken case
  if (selfRecord) {
    importRecord(to, compiledExport as ProviderToken, selfRecord);
  };
}

function processModuleExports(exportedModule: ExportedModule, from: Injector, to: Injector) {
  const { from: module, providers } = exportedModule;
  const fromInjector = from.imports.get(module);
  if (!fromInjector) {
    throw Error(`Cannot export from ${module} module`);
  }

  return from.providers.forEach((collection, token) => {
    collection.forEach(record => {
      if (record && record.host === (fromInjector as any) && (providers ? providers.includes(token) : true)) {
        importRecord(to, token, record);
      }
    });
  });
}

export function importRecord(injector: Injector, token: ProviderToken, record: ProviderRecord) {
  let collection = injector.providers.get(token);
  if (collection === undefined) {
    collection = [undefined];
    injector.providers.set(token, collection);
  }
  collection.splice(1, 0, record); // imported provider record always add to the second index - first is for record from given injector
}

function retrieveMetadata(module: ModuleImportItem): RetrievedMetadata | Promise<RetrievedMetadata> {
  return wait(
    resolveRef(module),
    m => extractModuleMetadata(m),
  );
}

function extractModuleMetadata(meta: ClassType | ModuleMetadata | DynamicModule | Array<Provider>): RetrievedMetadata | Promise<RetrievedMetadata> {
  const moduleMetadata = getModuleDefinition(meta);
  if (moduleMetadata) {
    return { type: meta as ClassType, moduleDefs: [], coreModuleDef: moduleMetadata };
  }
  // maybe DynamicModule case
  const moduleDefs: Array<ModuleMetadata> = [];
  return wait(
    retrieveDynamicModule(meta as DynamicModule | ModuleMetadata, moduleDefs),
    retrieved => {
      if (retrieved?.type) {
        return { type: retrieved.type as ClassType, moduleDefs, coreModuleDef: retrieved.coreModuleDef };
      };
    },
  );
}

function createCompiledModule(type: ClassType, coreModuleDef: ModuleMetadata, moduleDefs: Array<ModuleMetadata>, parent?: CompiledModule): CompiledModule {
  return { type, coreModuleDef, moduleDefs, imports: new Map(), providers: [], exports: [], exportedImports: new Map(), injector: undefined, proxy: false, parent };
}

interface RetrieveDynamicModule {
  type: ClassType | ModuleToken;
  coreModuleDef: ModuleMetadata;
} 

function retrieveDynamicModule(dynamicModule: DynamicModule | ModuleMetadata, moduleDefs: Array<ModuleMetadata>): RetrieveDynamicModule | Promise<RetrieveDynamicModule> | undefined {
  if (dynamicModule) {
    moduleDefs.push(dynamicModule);
    if ((dynamicModule as DynamicModule).extends !== undefined) {
      return wait(
        resolveRef((dynamicModule as DynamicModule).extends),
        probablyModule => {
          if (typeof probablyModule === 'object') {
            return retrieveDynamicModule(probablyModule, moduleDefs);
          }
          const metadata = getModuleDefinition(probablyModule);
          if (metadata) {
            return { type: probablyModule, coreModuleDef: metadata };
          }
        }
      );
    }
  }
}

function findModuleInTree(compiled: CompiledModule): CompiledModule {
  const moduleType = compiled.type;
  let parent = compiled.parent;
  while (parent) {
    if (parent.type === moduleType) return parent;
    const maybeImport = parent.imports.get(moduleType);
    if (maybeImport) return maybeImport;
    parent = parent.parent;
  }
}

function initModules(stack: Set<CompiledModule>) {
  return waitSequence(
    Array.from(stack.values()).reverse(), 
    compiled => initInjector(compiled.injector),
  );
}

export function initInjector(injector: Injector) {
  if (injector.status & InjectorStatus.INITIALIZED) return; 
  injector.status |= InjectorStatus.INITIALIZED;

  const initializers = injector.providers.get(INITIALIZERS);
  return wait(
    initializers[0].defs.length && injector.get(INITIALIZERS),
    _ => injector.get(MODULE_REF),
  )
}
