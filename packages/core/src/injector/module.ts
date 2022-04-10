import { Injector } from "./injector";
import { INITIALIZERS, MODULE_REF } from "../constants";
import { InjectorStatus } from "../enums";
import { getModuleDefinition } from "../decorators";
import { resolveRef, wait, waitAll, waitSequentially } from "../utils";

import type { ClassType, ModuleID, DynamicModule, ModuleImportItem, ModuleMetadata, InjectorOptions, Provider } from "../interfaces";

interface CompiledModule {
  type: ClassType;
  moduleDef: ModuleMetadata;
  dynamicDef: DynamicModule;
  injector: Injector;
  exportTo: Injector;
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

export function exportModule(injector: Injector, to: Injector): void {

}

function processModule(compiled: CompiledModule, stack: Array<Injector>): void | Promise<void> {
  const { moduleDef, dynamicDef, injector } = compiled;
  const compiledModules: Array<CompiledModule> = [];

  const imports: Array<ModuleImportItem> = [...moduleDef.imports || [], ...dynamicDef.imports || []];
  if (imports.length === 0) return;
  return waitAll(
    imports.map(i => processImportItem(i, compiledModules, injector, stack)),
    () => waitSequentially(
      compiledModules, 
      c => processModule(c, stack),
      () => processMetadata(compiled),
    ),
  );
}

function processImportItem(
  module: ModuleImportItem, 
  compiledModules: Array<CompiledModule>, 
  parent: Injector,
  stack: Array<Injector>,
): void | Promise<void> {
  return wait(
    compileMetadata(module),
    compiled => processCompiledImportItem(compiled, compiledModules, parent, stack) as any,
  ) as unknown as void;
}

function processCompiledImportItem(
  processed: CompiledModule | undefined,
  compiled: Array<CompiledModule>,
  parent: Injector,
  stack: Array<Injector>,
) {
  if (!processed) return;
  compiled.push(processed);

  const { type, dynamicDef } = processed;
  const id = (dynamicDef && dynamicDef.id) || 'static';
  
  let injector: Injector, foundedInjector = findModule(parent, type, id);
  if (foundedInjector === undefined) {
    injector = new Injector(type, parent, { id });
    stack.push(injector);
  } else {
    // check also here circular references between modules

    // make proxy and don't push to the `stack` array - it shouldn't be initialized (TODO: Initialize only MODULE_INITIALIZERS)
    injector = new Injector(type, foundedInjector, { id });
    // injector.status |= InjectorStatus.PROXY_MODE;
    // processedModule.isProxy = true;
  }
  processed.injector = injector;
  processed.exportTo = parent;

  // add injector to the imports of parent injector
  let modules = parent.imports.get(type);
  if (modules === undefined) {
    modules = new Map<ModuleID, Injector>();
    parent.imports.set(type, modules);
  }
  modules.set(id, injector);
}

function processMetadata({ injector, moduleDef, dynamicDef, exportTo }: CompiledModule) {
  injector.provide(...moduleDef.providers || []);
  injector.export(exportTo, moduleDef.exports);
  if (dynamicDef) {
    injector.provide(...dynamicDef.providers || []);
    injector.export(exportTo, dynamicDef.exports);
  }
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
    if (dynamicDef.module !== undefined) { // DynamicModule case
      meta = dynamicDef.module;
      moduleDef = getModuleDefinition(meta);
    } else { // ModuleMetadata case
      dynamicDef = undefined;
      moduleDef = meta as ModuleMetadata;
    }
  }

  if (moduleDef === undefined && dynamicDef === undefined) {
    throw new Error(`Given value/type ${meta} cannot be used as ADI Module`);
  }
  return { type: meta as any, moduleDef: moduleDef || {}, dynamicDef: dynamicDef || {} as any, injector: undefined, exportTo: undefined };
}

function findModule(injector: Injector, type: ClassType, id: ModuleID): Injector | undefined | never {
  if (type === injector.metatype) {
    // TODO: Check this statement - maybe error isn't needed
    // throw Error('Cannot import this same module to injector');
    // console.log('Cannot import this same module to itself');
    return undefined;
  }
  
  let foundedModule = injector.imports.get(type);
  if (foundedModule && foundedModule.has(id)) {
    return foundedModule.get(id);
  }
  
  let parentInjector = injector.parent;
  // Change this statement in the future as CoreInjector - ADI should read imports from CoreInjector
  while (parentInjector !== null) {
    // TODO: Check this statement - maybe it's needed
    if (type === parentInjector.metatype) {
      return parentInjector;
    }

    foundedModule = parentInjector.imports.get(type);
    if (foundedModule && foundedModule.has(id)) {
      return foundedModule.get(id);
    }
    parentInjector = parentInjector.parent;
  }
  return undefined;
}

function initInjectors(stack: Array<Injector>): void {
  return waitSequentially(stack.reverse(), initInjector);
}

function initInjector(injector: Injector) {
  if (injector.status & InjectorStatus.INITIALIZED) return; 
  injector.status |= InjectorStatus.INITIALIZED;

  // // resolve INJECTOR_OPTIONS provider again
  // loadOptions(injector);

  return wait(
    () => {
      const initializers = injector.providers.get(INITIALIZERS) || [];
      if (initializers[0]?.defs.length) {
        return injector.get(INITIALIZERS);
      }
    },
    () => wait(
      injector.get(MODULE_REF), 
      () => injector.status |= InjectorStatus.INITIALIZED,      
    ),
  );
}