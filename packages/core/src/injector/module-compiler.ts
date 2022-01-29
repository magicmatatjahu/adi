import { Injector, NilInjector, initInjector } from "./injector";
import {
  Type,
  ModuleMetadata,
  DynamicModule,
  ForwardRef,
  FactoryDef,
  CompiledModule,
  ModuleID,
  Provider,
  ImportItem,
} from "../interfaces"
import { resolveRef, thenable } from "../utils";
import { EMPTY_ARRAY, EMPTY_OBJECT } from "../constants";
import { InjectorStatus } from "../enums";

import { getModuleDef } from "./metadata";
import { createFactory } from "./resolver";
import { Session } from "..";

export function build(
  injector: Injector,
): void {
  const compiledModule = compileMetadata(injector.metatype) as CompiledModule;
  compiledModule.injector = injector;
  compiledModule.exportTo = injector.parent;
  const stack: Array<CompiledModule> = [compiledModule];
  processModule(compiledModule, stack);
  initModules(stack);
}

export async function buildAsync(
  injector: Injector,
): Promise<void> {
  const compiledModule = await compileMetadata(injector.metatype);
  compiledModule.injector = injector;
  compiledModule.exportTo = injector.parent;
  const stack: Array<CompiledModule> = [compiledModule];
  await processModule(compiledModule, stack);
  await initModulesAsync(stack);
}

export function initModules(stack: Array<CompiledModule>): void {
  for (let i = stack.length - 1; i > -1; i--) {
    const compiled = stack[i];
    if (compiled.isProxy === false) {
      compiled.stack && initModules(compiled.stack);
      initInjector(compiled.injector);
    }
  }
}

const asyncInitOptions = { asyncMode: true };
export async function initModulesAsync(stack: Array<CompiledModule>): Promise<void> {
  for (let i = stack.length - 1; i > -1; i--) {
    const compiled = stack[i];
    if (compiled.isProxy === false) {
      compiled.stack && await initModulesAsync(compiled.stack);
      await initInjector(compiled.injector, asyncInitOptions);
    }
  }
}

///// NEW IMPLEMENTATION
export function buildNew(
  injector: Injector,
): void | Promise<void> {
  return thenable(
    () => compileMetadata(injector.metatype) as any,
    (compiled: CompiledModule) => {
      compiled.injector = injector;
      compiled.exportTo = injector.parent;
      const stack: Array<CompiledModule> = [compiled];
      return thenable(
        () => processModule(compiled, stack),
        () => initModulesNew(stack),
      );
    }
  );
}

export function initModulesNew(stack: Array<CompiledModule>): void {
  for (let i = stack.length - 1; i > -1; i--) {
    const compiled = stack[i];
    if (compiled.isProxy === false) initInjector(compiled.injector);
  }
}

function processModules(
  modules: Array<CompiledModule>,
  index: number,
  stack: Array<CompiledModule>,
) {
  if (modules.length === index) return;
  return thenable(
    () => processModule(modules[index], stack),
    () => processModules(modules, ++index, stack),
  );
}

function processModule(compiledModule: CompiledModule, stack: Array<CompiledModule>) {
  const { moduleDef, dynamicDef, injector, isProxy } = compiledModule;
  const compiledModules: Array<CompiledModule> = [];
  
  let imports: ImportItem[] = [];
  // for proxy performs logic only on dynamicDef. Performing logic when module is proxy might end up overwriting some providers
  if (isProxy === false) imports.push(...(moduleDef.imports || EMPTY_ARRAY));
  if (dynamicDef) imports.push(...(dynamicDef.imports || EMPTY_ARRAY));

  return thenable(
    // first iterate in all imports and create injectors for given modules
    () => processImports(imports, 0, compiledModules, injector, stack),
    // then process all imports and go depper in imports graph    
    () => thenable(
      () => processModules(compiledModules, 0, stack),
      // at the end process all providers/components/exports from given module
      // very important to perform that logic at the end because exports will have all needed data
      () => {
        processMetadata(compiledModule);
        return processFactories(findFactories(compiledModules), 0);
      }
    ),
  );
}

function processImports<T = any>(
  imports: Array<Type<T> | ModuleMetadata | DynamicModule<T> | Promise<Type<T> | DynamicModule<T>> | ForwardRef<T>>,
  index: number,
  compiledModules: Array<CompiledModule>,
  parentInjector: Injector,
  stack: Array<CompiledModule>,
) {
  if (imports.length === index) return;
  return thenable(
    () => processImportNew(imports[index], compiledModules, parentInjector, stack),
    () => processImports(imports, ++index, compiledModules, parentInjector, stack),
  );
}

function processImportNew<T = any>(
  imp: Type<T> | ModuleMetadata | DynamicModule<T> | Promise<Type<T> | DynamicModule<T>> | ForwardRef<T>,
  compiledModules: Array<CompiledModule>,
  parentInjector: Injector,
  stack: Array<CompiledModule>,
) {
  return thenable(
    () => compileMetadata(imp),
    compiled => processImportItemNew(compiled, compiledModules, parentInjector, stack) as any,
  );
}

function processImportItemNew(
  processedModule: CompiledModule,
  compiledModules: Array<CompiledModule>,
  parentInjector: Injector,
  stack: Array<CompiledModule>,
) {
  if (!processedModule) return;
  compiledModules.push(processedModule);
  stack.push(processedModule);

  const { type, dynamicDef } = processedModule;
  const id = (dynamicDef && dynamicDef.id) || 'static';
  
  let injector: Injector, foundedInjector = findModule(parentInjector, type, id);
  if (foundedInjector === undefined) {
    injector = Injector.create(type, parentInjector, { id });
  } else {
    // check also here circular references between modules

    // make proxy and don't push to the `stack` array - it shouldn't be initialized (TODO: Initialize only MODULE_INITIALIZERS)
    injector = Injector.create(type, foundedInjector, { id });
    injector.status |= InjectorStatus.PROXY_MODE;
    processedModule.isProxy = true;
  }
  processedModule.injector = injector;
  processedModule.exportTo = parentInjector;

  // add injector to the imports of parent injector
  let modules = parentInjector.imports.get(type);
  if (modules === undefined) {
    modules = new Map<ModuleID, Injector>();
    parentInjector.imports.set(type, modules);
  }
  modules.set(id, injector);
}

function processMetadata({ injector, isProxy, moduleDef, dynamicDef, exportTo }: CompiledModule) {
  if (isProxy === false) {
    injector.addProviders(moduleDef.components, true);
    injector.addProviders(moduleDef.providers, false);
    injector.export(moduleDef.exports, exportTo);
  }
  if (dynamicDef !== undefined) {
    injector.addProviders(dynamicDef.components, true);
    injector.addProviders(dynamicDef.providers, false);
    injector.export(dynamicDef.exports, exportTo);
  }
}

function processMetadataNew(injector: Injector, metadata: ModuleMetadata, exportTo: Injector) {
  injector.addProviders(metadata.components, true);
  injector.addProviders(metadata.providers, false);
  injector.export(metadata.exports, exportTo);
}

function findFactories(stack: Array<CompiledModule>) {
  const factories: Array<CompiledModule> = [];
  for (let i = 0, l = stack.length; i < l; i++) {
    const compiled = stack[i];
    if (compiled.useFactory) {
      compiled.stack = [];
      factories.push(compiled);
    }
  }
  return factories;
}

function processFactories(
  factories: Array<CompiledModule>,
  index: number,
) {
  if (factories.length === index) return;
  return thenable(
    () => processFactory(factories[index]),
    () => processFactories(factories, ++index),
  );
}

function processFactory(factory: CompiledModule) {
  const { useFactory, injector, stack, exportTo } = factory;
  return thenable(
    () => useFactory(injector, Session.createStandalone(undefined, injector)),
    metadata => {
      const compiledModules: CompiledModule[] = [];
      return thenable(
        // first iterate in all imports and create injectors for given modules
        () => processImports(metadata.imports || [], 0, compiledModules, injector, stack),
        // then process all imports and go depper in imports graph    
        () => thenable(
          () => processModules(compiledModules, 0, stack),
          // at the end process all providers/components/exports from given module
          // very important to perform that logic at the end because exports will have all needed data
          () => processMetadataNew(injector, metadata, exportTo),
        ),
      );
    }
  );
}

function compileMetadata<T>(
  metatype: Type<T> | Array<Provider> | ModuleMetadata | DynamicModule<T> | Promise<Type<T> | DynamicModule<T>> | ForwardRef<T>,
  strict: boolean = true,
): CompiledModule | Promise<CompiledModule> {
  metatype = resolveRef(metatype);
  if (!metatype) {
    return;
  }

  return thenable<any>(
    () => metatype,
    m => extractMetadata(m, strict),
  );
}

function extractMetadata<T>(
  metatype?: Type<T> | ModuleMetadata | Array<Provider> | DynamicModule<T>,
  strict?: boolean,
): CompiledModule {
  if (!metatype) {
    return;
  }
  
  let moduleDef = getModuleDef(metatype, false), 
    dynamicDef: DynamicModule<T> = undefined,
    useFactory: FactoryDef = undefined;

  if (moduleDef === undefined) { // maybe DynamicModule case
    dynamicDef = metatype as DynamicModule<T>;
    if (dynamicDef.module !== undefined) { // DynamicModule case
      metatype = dynamicDef.module;
      moduleDef = getModuleDef(metatype, false);
      if (typeof dynamicDef.useFactory === 'function') {
        useFactory = createFactory(dynamicDef.useFactory, dynamicDef.inject || []);
      }
    } else { // ModuleMetadata case
      dynamicDef = undefined;
      moduleDef = metatype as ModuleMetadata;
    }
  }

  if (moduleDef === undefined && dynamicDef === undefined) {
    if (strict === true) {
      throw new Error(`Given value/type ${metatype} cannot be used as ADI Module`);
    }
    return;
  }

  return { 
    type: metatype as Type, 
    // EMPTY_OBJECT is for case when someone pass the object as module
    moduleDef: moduleDef || EMPTY_OBJECT, 
    dynamicDef, 
    useFactory, 
    injector: undefined, 
    exportTo: undefined, 
    isProxy: false,
    stack: undefined,
  };
}

// injector is here for searching in his parent and more depper
function findModule(injector: Injector, type: Type, id: ModuleID): Injector | undefined | never {
  if (type === injector.metatype) {
    // TODO: Check this statement - maybe error isn't needed
    // throw Error('Cannot import this same module to injector');
    console.log('Cannot import this same module to itself');
    return undefined;
  }
  
  let foundedModule = injector.imports.get(type);
  if (foundedModule && foundedModule.has(id)) {
    return foundedModule.get(id);
  }
  
  let parentInjector = injector.parent;
  // Change this statement in the future as CoreInjector - ADI should read imports from CoreInjector
  while (parentInjector !== NilInjector) {
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

// function process(compiledModule: CompiledModule, stack: Array<Injector>) {
//   const { moduleDef, dynamicDef, injector, isProxy } = compiledModule;
//   // for proxy performs only acitions on dynamicDef. Performing action when is facade on moduleDef might end up overwriting some providers
//   const compiledModules: Array<CompiledModule> = [];

//   // first iterate in all imports and create injectors for given modules
//   let imports: ImportItem[];
//   if (isProxy === false) {
//     imports = moduleDef.imports || EMPTY_ARRAY;
//     for (let i = 0, l = imports.length; i < l; i++) {
//       processImport(imports[i], compiledModules, injector, stack);
//     }
//   }
//   imports = (dynamicDef && dynamicDef.imports) || EMPTY_ARRAY;
//   for (let i = 0, l = imports.length; i < l; i++) {
//     processImport(imports[i], compiledModules, injector, stack);
//   }

//   // first process all imports and go more depper in modules graph
//   for (let i = 0, l = compiledModules.length; i < l; i++) {
//     process(compiledModules[i], stack);
//   }

//   processMetadata(compiledModule);
// }