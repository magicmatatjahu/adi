import { getModuleDef } from "../decorators";
import { Injector, NilInjector } from ".";
import {
  Type,
  ModuleMetadata,
  DynamicModule,
  ForwardRef,
  CompiledModule,
  ModuleID,
} from "../interfaces"
import { resolveRef, thenable } from "../utils";
import { EMPTY_ARRAY, EMPTY_OBJECT } from "../constants";

export class ModuleCompiler {
  build(
    injector: Injector,
  ): void {
    const compiledModule = this.compileMetadata(injector.injector as any) as CompiledModule;
    compiledModule.injector = injector;
    compiledModule.exportTo = injector.parent;
    const stack: Array<Injector> = [injector];
    this.process(compiledModule, stack);
    this.initModules(stack);
  }

  async buildAsync(
    injector: Injector,
  ): Promise<void> {
    const compiledModule = await this.compileMetadata(injector.injector as any);
    compiledModule.injector = injector;
    compiledModule.exportTo = injector.parent;
    const stack: Array<Injector> = [injector];
    await this.processAsync(compiledModule, stack);
    await this.initModulesAsync(stack);
  }

  public process(compiledModule: CompiledModule, stack: Array<Injector>) {
    // for proxy performs only acitions on dynamicDef. Performing action when is facade on moduleDef might end up overwriting some providers
    const { moduleDef, dynamicDef, injector, exportTo, isProxy } = compiledModule;
    const compiledModules: Array<CompiledModule> = [];

    // first iterate in all imports and create injectors for given modules
    let imports = moduleDef.imports || EMPTY_ARRAY;
    if (isProxy === false) {
      for (let i = 0, l = imports.length; i < l; i++) {
        this.processImport(imports[i], compiledModules, injector, stack);
      }
    }
    imports = (dynamicDef && dynamicDef.imports) || EMPTY_ARRAY;
    for (let i = 0, l = imports.length; i < l; i++) {
      this.processImport(imports[i], compiledModules, injector, stack);
    }

    // first process all imports and go more depper in modules graph
    for (let i = 0, l = compiledModules.length; i < l; i++) {
      this.process(compiledModules[i], stack);
    }

    if (isProxy === false) {
      injector.addProviders(moduleDef.providers);
      injector.addComponents(moduleDef.components);
      injector.processExports(moduleDef.exports, injector, exportTo);
    }
    if (dynamicDef !== undefined) {
      injector.addProviders(dynamicDef.providers);
      injector.addComponents(dynamicDef.components);
      injector.processExports(dynamicDef.exports, injector, exportTo);
    }
  }

  public async processAsync({ moduleDef, dynamicDef, injector, exportTo, isProxy }: CompiledModule, stack: Array<Injector>) {
    // for proxy performs only actions on dynamicDef. Performing action when is facade on moduleDef might end up overwriting some providers
    const compiledModules: Array<CompiledModule> = [];

    // first iterate in all imports and create injectors for given modules
    let imports = moduleDef.imports || EMPTY_ARRAY;
    if (isProxy === false) {
      for (let i = 0, l = imports.length; i < l; i++) {
        await this.processImport(imports[i], compiledModules, injector, stack);
      }
    }
    imports = (dynamicDef && dynamicDef.imports) || EMPTY_ARRAY;
    for (let i = 0, l = imports.length; i < l; i++) {
      await this.processImport(imports[i], compiledModules, injector, stack);
    }

    // first process all imports and go more depper in modules graph
    for (let i = 0, l = compiledModules.length; i < l; i++) {
      await this.processAsync(compiledModules[i], stack);
    }

    if (isProxy === false) {
      injector.addProviders(moduleDef.providers);
      injector.addComponents(moduleDef.components);
      injector.processExports(moduleDef.exports, injector, exportTo);
    }
    if (dynamicDef !== undefined) {
      injector.addProviders(dynamicDef.providers);
      injector.addComponents(dynamicDef.components);
      injector.processExports(dynamicDef.exports, injector, exportTo);
    }
  }

  private processImport<T = any>(
    _import: Type<T> | ModuleMetadata | DynamicModule<T> | Promise<DynamicModule> | ForwardRef<T>,
    compiledModules: Array<CompiledModule>,
    parentInjector: Injector,
    stack: Array<Injector>,
  ) {
    return thenable(
      () => this.compileMetadata(_import),
      compiledModule => this.processImportItem(compiledModule, compiledModules, parentInjector, stack) as any,
    );
  }

  private processImportItem(
    processedModule: CompiledModule,
    compiledModules: Array<CompiledModule>,
    parentInjector: Injector,
    stack: Array<Injector>,
  ) {
    if (processedModule === undefined) return;

    const { type, dynamicDef } = processedModule;
    const id = (dynamicDef && dynamicDef.id) || 'static';
    
    let injector: Injector, foundedInjector = this.findModule(parentInjector, type, id);
    if (foundedInjector === undefined) {
      injector = Injector.create(type, parentInjector, { id });
      stack.push(injector);
    } else {
      // check also here circular references between modules

      // make proxy and don't push facade to the `stack` array
      injector = Injector.create(type, foundedInjector, { id });
      processedModule.isProxy = true;
    }
    processedModule.injector = injector;
    processedModule.exportTo = parentInjector;
    compiledModules.push(processedModule);

    // add injector to the imports of parent injector
    const imports: Map<Type, Injector | Map<ModuleID, Injector>> = (parentInjector as any).imports;
    if (imports.has(type)) {
      let modules = imports.get(type);

      if ((modules instanceof Map) === false) {
        const map = new Map();
        imports.set(type, map);
        modules = map.set((modules as Injector).id, modules);
      }
      (modules as Map<ModuleID, Injector>).set(id, injector);
    } else {
      imports.set(type, injector);
    }

    // TODO: Checks also exported modules in imports
  }

  private compileMetadata<T>(
    metatype: Type<T> | ModuleMetadata | DynamicModule<T> | Promise<DynamicModule> | ForwardRef<T>
  ): CompiledModule | Promise<CompiledModule> {
    let mod = resolveRef(metatype);
    if (!mod) {
      return;
    }

    return thenable<any>(
      () => mod,
      this.extractMetadata,
    );
  }

  private extractMetadata<T>(metatype?: Type<T> | DynamicModule<T>): CompiledModule {
    if (!metatype) {
      return;
    }
    
    let moduleDef = getModuleDef(metatype), 
      dynamicDef: DynamicModule<T> = undefined;

    // DynamicModule case
    if (moduleDef === undefined) {
      dynamicDef = metatype as DynamicModule<T>;
      metatype = dynamicDef.module;
      if (metatype !== undefined) {
        moduleDef = getModuleDef(metatype);
      }
    }

    if (moduleDef === undefined && dynamicDef === undefined) {
      throw new Error(`Given value/type ${metatype} cannot be used as ADI Module`);
    }

    // EMPTY_OBJECT is for case when someone pass the object as module
    return { type: metatype as Type, moduleDef: moduleDef || EMPTY_OBJECT, dynamicDef, injector: undefined, exportTo: undefined, isProxy: false };
  }

  // injector is here for searching in his parent and more depper
  private findModule(injector: Injector, mod: Type, id: ModuleID): Injector | undefined {
    if (mod === injector.injector) {
      // TODO: Check this statement - maybe error isn't needed
      // throw Error('Cannot import this same module to injector');
      console.log('Cannot import this same module to injector');
      return undefined;
    }
  
    let foundedModule = (injector as any).imports.get(mod);
    if (foundedModule) {
      if (foundedModule instanceof Map && foundedModule.has(id)) {
        return foundedModule.get(id);
      } else if (foundedModule.id === id) {
        return foundedModule as Injector;
      }
    }
  
    let parentInjector = injector.getParent();
    // Change this statement in the future as CoreInjector - ADI should read imports from CoreInjector
    while (parentInjector !== NilInjector) {
      // TODO: Check this statement - maybe it's needed
      if (mod === parentInjector.injector) {
        return parentInjector;
      }
      foundedModule = (parentInjector as any).imports.get(mod);
  
      if (foundedModule) {
        if (foundedModule instanceof Map && foundedModule.has(id)) {
          return foundedModule.get(id);
        } else if (foundedModule.id === id) {
          return foundedModule as Injector;
        }
      }
      parentInjector = parentInjector.getParent();
    }
    return undefined;
  }

  // TODO: Think about changing the order of initialization from latest module
  private initModules(stack: Array<Injector>): void {
    for (let i = 0, l = stack.length; i < l; i++) {
      (stack[i] as any).initModule();
    }
  }

  private async initModulesAsync(stack: Array<Injector>): Promise<void> {
    for (let i = 0, l = stack.length; i < l; i++) {
      await (stack[i] as any).initModule();
    }
  }
}

export const Compiler = new ModuleCompiler();
