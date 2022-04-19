import { InjectionToken } from "./injection-token";
import { Injector } from "./injector";
import { inject } from "./resolver";
import { INITIALIZERS, INJECTOR_CONFIG, MODULE_REF } from "../constants";
import { InjectionKind, InjectorStatus } from "../enums";
import { getModuleDefinition } from "../decorators";
import { resolveRef, wait, waitAll, waitSequence } from "../utils";

import type { ClassType, ModuleID, DynamicModule, ModuleImportItem, ModuleMetadata, ModuleExportItem, InjectorOptions, Provider, ProviderToken, ProviderRecord, CustomProvider, ExportedModule } from "../interfaces";

interface CompiledModule {
  type: ClassType;
  moduleDef: ModuleMetadata;
  dynamicDef: DynamicModule;
  injector: Injector;
  exportTo: Injector;
  proxy: boolean;
}

export function initModule(injector: Injector): Injector | Promise<Injector> {
  return importModule(injector, injector.metatype, injector.options, false);
}

export function importModule(to: Injector, metadata: ModuleImportItem | ModuleMetadata | Array<Provider>, options: InjectorOptions, createInjector: boolean = true): Injector | Promise<Injector> {
  let metatype = to.metatype;
  if (Array.isArray(metatype)) {
    metatype = { providers: to.metatype } as ModuleMetadata;
  }

  return wait(
    compileMetadata(metadata),
    compiled => {
      const injector = createInjector ? new Injector(compiled.type, to, options) : to;
      compiled.injector = injector;
      compiled.exportTo = injector.parent;
      const stack: Array<Injector> = [injector];
      return wait(
        processModule(compiled, stack), 
        () => wait(
          initInjectors(stack),
          () => injector
        ),
      ) as any;
    }
  ) as any
}

export function exportModule(exports: Array<ModuleExportItem> = [], from: Injector, to: Injector): void {
  exports.forEach(exp => processExport(exp, from, to));
}

function processModule(compiled: CompiledModule, stack: Array<Injector>): void | Promise<void> {
  processProviders(compiled);
  const { moduleDef, dynamicDef, injector, proxy } = compiled;
  const compiledModules: Array<CompiledModule> = [];

  const imports: Array<ModuleImportItem> = [];
  if (proxy === false) imports.push(...moduleDef.imports || []);
  imports.push(...dynamicDef.imports || []);

  if (imports.length === 0) return processExports(compiled);
  return waitAll(
    imports.map(i => processImport(i, compiledModules, injector, stack)),
    () => waitSequence(
      compiledModules, 
      c => processModule(c, stack),
      () => processExports(compiled),
    ),
  );
}

function processImport(
  module: ModuleImportItem, 
  compiledModules: Array<CompiledModule>, 
  parent: Injector,
  stack: Array<Injector>,
): void | Promise<void> {
  return wait(
    compileMetadata(module),
    compiled => {
      if (!compiled) return undefined;
      compiledModules.push(compiled);
      compiled.exportTo = parent;
    
      const { type, dynamicDef } = compiled;
      const id = (dynamicDef && dynamicDef.id) || 'static';
      
      const foundInjector = findModule(parent, type, id);
      if (foundInjector === undefined) {
        stack.push(compiled.injector = Injector.create(type, parent, { id }));
      } else {
        compiled.injector = foundInjector;
        compiled.proxy = true;
      }
    }
  ) as unknown as void;
}

export function importModuleToParent(injector: Injector, type: ClassType, id: ModuleID, parent: Injector) {
  let modules = parent.imports.get(type);
  if (modules === undefined) {
    modules = new Map<ModuleID, Injector>();
    parent.imports.set(type, modules);
  }
  if (modules.has(id)) return; // TODO: Fix that
  modules.set(id, injector);
} 

function processProviders({ injector, moduleDef, dynamicDef, proxy }: CompiledModule) {
  proxy === false && injector.provide(...moduleDef.providers || []);
  injector.provide(...dynamicDef.providers || []);
  loadModuleConfig(injector);
}

function processExports({ injector, moduleDef, dynamicDef, exportTo, proxy }: CompiledModule) {
  proxy === false && injector.export(moduleDef.exports, exportTo);
  injector.export(dynamicDef.exports, exportTo);
}

function compileMetadata(module: ModuleImportItem | ModuleMetadata | Array<Provider>): CompiledModule | Promise<CompiledModule> {
  return wait(
    resolveRef(module),
    m => extractModuleMetadata(m) as any,
  ) as any;
}

function extractModuleMetadata(meta: ClassType | ModuleMetadata | DynamicModule | Array<Provider>): CompiledModule | Promise<CompiledModule> {
  let moduleDef = getModuleDefinition(meta), 
    dynamicDef: DynamicModule = undefined;

  if (moduleDef === undefined) { // maybe DynamicModule case
    dynamicDef = meta as DynamicModule;
    if (dynamicDef && dynamicDef.module !== undefined) { // DynamicModule case
      meta = dynamicDef.module;
      moduleDef = getModuleDefinition(meta);
    } else { // ModuleMetadata case
      dynamicDef = undefined;
      moduleDef = meta as ModuleMetadata;
    }
  }

  if (moduleDef === undefined && dynamicDef === undefined) return;
  return { type: meta as any, moduleDef: moduleDef || {}, dynamicDef: dynamicDef || {} as any, injector: undefined, exportTo: undefined, proxy: false };
}

function findModule(injector: Injector, type: ClassType, id: ModuleID): Injector | undefined {
  if (type === injector.metatype && id === injector.options.id) { // cannot import module to itself
    return;
  }
  
  let foundModule: Injector = injector.imports.get(type)?.get(id);
  if (foundModule) {
    return foundModule;
  }
  
  let parentInjector = injector.parent;
  // Change this statement in the future as CoreInjector - ADI should read imports from CoreInjector
  while (parentInjector !== null) {
    // TODO: Check this statement - maybe it's needed
    if (type === parentInjector.metatype && id === parentInjector.options.id) {
      return parentInjector;
    }

    foundModule = parentInjector.imports.get(type)?.get(id);
    if (foundModule) {
      return foundModule;
    }
    parentInjector = parentInjector.parent;
  }
}

function processExport(exp: ModuleExportItem, from: Injector, to: Injector): void {
  exp = resolveRef(exp);

  // exported module or provider
  if (typeof exp === 'object') {
    if ((exp as ExportedModule).from) {
      return processModuleExports(exp as ExportedModule, from, to);
    }

    if ((exp as CustomProvider).provide) {
      to.provide(exp as CustomProvider);
    }

    // InjectionToken case
    const injectionToken = exp as InjectionToken;
    const record = from.providers.get(injectionToken);
    return record && record[0] && importRecord(to, injectionToken, record[0]);
  }

  // classType provider
  if (typeof exp === 'function') {
    // maybe module
    if (getModuleDefinition(exp)) return;

    const record = from.providers.get(exp);
    return (record && record[0]) ? importRecord(to, exp, record[0]) : to.provide(exp as any);
  }

  // string, symbol
  const record = from.providers.get(exp);
  record && record[0] && importRecord(to, exp, record[0]);
}

function processModuleExports(exportedModule: ExportedModule, from: Injector, to: Injector) {
  const { from: module, id, providers } = exportedModule;
  const fromInjector = from.imports.get(module)?.get(id || 'static');
  if (fromInjector === undefined) {
    throw Error(`Cannot export from ${module} module`);
  }

  return from.providers.forEach((collection, token) => {
    collection.forEach(record => {
      if (record && record.host === fromInjector && (providers ? providers.includes(token) : true)) {
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
  collection.splice(1, 0, record); // always insert to the second index 
}

function initInjectors(stack: Array<Injector>): void {
  return waitSequence(stack.reverse(), initInjector);
}

function initInjector(injector: Injector) {
  if (injector.status & InjectorStatus.INITIALIZED) return; 
  injector.status |= InjectorStatus.INITIALIZED;
  
  return wait(
    initInitializers(injector),
    () => wait(
      injector.get(MODULE_REF), 
      () => injector.status |= InjectorStatus.INITIALIZED,      
    ),
  );
}

function initInitializers(injector: Injector) {
  const initializers = injector.providers.get(INITIALIZERS);
  if (initializers[0].defs.length) {
    return injector.get(INITIALIZERS);
  }
}

function loadModuleConfig(injector: Injector): void {
  if (!injector.providers.has(INJECTOR_CONFIG)) return;
  const options = (inject(injector, undefined, { token: INJECTOR_CONFIG, hooks: [], metadata: { target: injector, kind: InjectionKind.STANDALONE } }) || {}) as InjectorOptions;
  Object.assign(injector.options, options, { scopes: ['any', injector.metatype, ...options.scopes || []] });
}
