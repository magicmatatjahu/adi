import { Injector, NilInjector, InjectorMetadata } from ".";
import {
  Type,
  ModuleMetadata,
  DynamicModule,
  ForwardRef,
  CompiledModule,
  ModuleID,
  Provider,
  ExportItem,
  ImportItem,
  ExportedModule,
} from "../interfaces"
import { resolveRef, thenable } from "../utils";
import { EMPTY_ARRAY, EMPTY_OBJECT } from "../constants";
import { InjectorStatus } from "../enums";
import { getModuleDef } from "../decorators";

export class ModuleCompiler {
  private asyncInitOptions = { asyncMode: true };

  build(
    injector: Injector,
  ): void;
  build(
    injector: Injector,
    isProto: true,
  ): Injector[];
  build(
    injector: Injector,
    isProto?: true,
  ): void | Injector[] {
    const compiledModule = this.compileMetadata(injector.metatype) as CompiledModule;
    compiledModule.injector = injector;
    compiledModule.exportTo = injector.parent;
    const stack: Array<Injector> = [injector];
    this.process(compiledModule, stack);

    if (isProto === true) {
      return stack;
    }
    this.initModules(stack);
  }

  async buildAsync(
    injector: Injector,
  ): Promise<void>;
  async buildAsync(
    injector: Injector,
    isProto: true,
  ): Promise<Injector[]>;
  async buildAsync(
    injector: Injector,
    isProto?: true,
  ): Promise<void | Injector[]> {
    const compiledModule = await this.compileMetadata(injector.metatype);
    compiledModule.injector = injector;
    compiledModule.exportTo = injector.parent;
    const stack: Array<Injector> = [injector];
    await this.processAsync(compiledModule, stack);

    if (isProto === true) {
      return stack;
    }
    await this.initModulesAsync(stack);
  }

  public process({ moduleDef, dynamicDef, injector, exportTo, isProxy }: CompiledModule, stack: Array<Injector>) {
    // for proxy performs only acitions on dynamicDef. Performing action when is facade on moduleDef might end up overwriting some providers
    const compiledModules: Array<CompiledModule> = [];

    // first iterate in all imports and create injectors for given modules
    let imports: ImportItem[];
    if (isProxy === false) {
      imports = moduleDef.imports || EMPTY_ARRAY;
      for (let i = 0, l = imports.length; i < l; i++) {
        this.processImport(imports[i], compiledModules, injector, isProxy, stack);
      }
    }
    imports = (dynamicDef && dynamicDef.imports) || EMPTY_ARRAY;
    for (let i = 0, l = imports.length; i < l; i++) {
      this.processImport(imports[i], compiledModules, injector, isProxy, stack);
    }

    // first process all imports and go more depper in modules graph
    for (let i = 0, l = compiledModules.length; i < l; i++) {
      this.process(compiledModules[i], stack);
    }

    if (isProxy === false) {
      injector.addProviders(moduleDef.providers);
      injector.addComponents(moduleDef.components);
      injector.exportsProviders(moduleDef.exports, exportTo);
    }
    if (dynamicDef !== undefined) {
      injector.addProviders(dynamicDef.providers);
      injector.addComponents(dynamicDef.components);
      injector.exportsProviders(dynamicDef.exports, exportTo);
    }
  }

  public async processAsync({ moduleDef, dynamicDef, injector, exportTo, isProxy }: CompiledModule, stack: Array<Injector>) {
    // for proxy performs only actions on dynamicDef. Performing action when is facade on moduleDef might end up overwriting some providers
    const compiledModules: Array<CompiledModule> = [];

    // first iterate in all imports and create injectors for given modules
    let imports: ImportItem[];
    if (isProxy === false) {
      imports = moduleDef.imports || EMPTY_ARRAY;
      for (let i = 0, l = imports.length; i < l; i++) {
        await this.processImportAsync(imports[i], compiledModules, injector, isProxy, stack);
      }
    }
    imports = (dynamicDef && dynamicDef.imports) || EMPTY_ARRAY;
    for (let i = 0, l = imports.length; i < l; i++) {
      await this.processImportAsync(imports[i], compiledModules, injector, isProxy, stack);
    }

    // first process all imports and then go more depper in modules graph
    for (let i = 0, l = compiledModules.length; i < l; i++) {
      await this.processAsync(compiledModules[i], stack);
    }

    if (isProxy === false) {
      injector.addProviders(moduleDef.providers);
      injector.addComponents(moduleDef.components);
      injector.exportsProviders(moduleDef.exports, exportTo);
    }
    if (dynamicDef !== undefined) {
      injector.addProviders(dynamicDef.providers);
      injector.addComponents(dynamicDef.components);
      injector.exportsProviders(dynamicDef.exports, exportTo);
    }
  }

  private processImport<T = any>(
    _import: Type<T> | ModuleMetadata | DynamicModule<T> | Promise<DynamicModule> | ForwardRef<T>,
    compiledModules: Array<CompiledModule>,
    parentInjector: Injector,
    isProxy: boolean,
    stack: Array<Injector>,
  ) {
    const compiledModule = this.compileMetadata(_import) as CompiledModule;
    if (!compiledModule) return;

    this.processImportItem(compiledModule as CompiledModule, compiledModules, parentInjector, stack);

    // let exports: ExportItem[];
    // if (isProxy === false) {
    //   exports = compiledModule.moduleDef.exports || EMPTY_ARRAY;
    //   for (let i = 0, l = exports.length; i < l; i++) {
    //     const exp = exports[i];
        
    //     const moduleDef = getModuleDef((exp as ExportedModule).module || exp);
    //     if (moduleDef == undefined) continue;
  
    //     if (typeof exp === "function") { // export can be module definition
    //       const moduleDef = getModuleDef(exp);
    //       if (moduleDef === undefined) return;
    //     }
    //   }
    // }
  }

  private async processImportAsync<T = any>(
    _import: Type<T> | ModuleMetadata | DynamicModule<T> | Promise<DynamicModule> | ForwardRef<T>,
    compiledModules: Array<CompiledModule>,
    parentInjector: Injector,
    isProxy: boolean,
    stack: Array<Injector>,
  ) {
    const compiledModule = await this.compileMetadata(_import);
    if (!compiledModule) return;
    this.processImportItem(compiledModule, compiledModules, parentInjector, stack);
  }

  private processImportItem(
    processedModule: CompiledModule,
    compiledModules: Array<CompiledModule>,
    parentInjector: Injector,
    stack: Array<Injector>,
  ) {
    const { type, dynamicDef } = processedModule;
    const id = (dynamicDef && dynamicDef.id) || 'static';
    
    let injector: Injector, foundedInjector = this.findModule(parentInjector, type, id);
    if (foundedInjector === undefined) {
      injector = Injector.create(type, parentInjector, { id });
      stack.push(injector);
    } else {
      // check also here circular references between modules

      // make proxy and don't push to the `stack` array - it shouldn't be initialized (TODO: Initialize only MODULE_INITIALIZERS)
      injector = Injector.create(type, foundedInjector, { id });
      injector.status |= InjectorStatus.PROXY_MODE;
      processedModule.isProxy = true;
    }
    processedModule.injector = injector;
    processedModule.exportTo = parentInjector;
    compiledModules.push(processedModule);

    // add injector to the imports of parent injector
    let modules = parentInjector.imports.get(type);
    if (modules === undefined) {
      modules = new Map<ModuleID, Injector>();
      parentInjector.imports.set(type, modules);
    }
    modules.set(id, injector);
  }

  private compileMetadata<T>(
    metatype: Type<T> | ModuleMetadata | Array<Provider> | DynamicModule<T> | Promise<DynamicModule> | ForwardRef<T>
  ): CompiledModule | Promise<CompiledModule> {
    metatype = resolveRef(metatype);
    if (!metatype) {
      return;
    }

    return thenable<any>(
      () => metatype,
      this.extractMetadata,
    );
  }

  private extractMetadata<T>(metatype?: Type<T> | ModuleMetadata | Array<Provider> | DynamicModule<T>): CompiledModule {
    if (!metatype) {
      return;
    }
    
    let moduleDef = InjectorMetadata.getModuleDef(metatype, false), 
      dynamicDef: DynamicModule<T> = undefined;

    if (moduleDef === undefined) { // maybe DynamicModule case
      dynamicDef = metatype as DynamicModule<T>;
      if (dynamicDef.module !== undefined) { // DynamicModule case
        metatype = dynamicDef.module;
        moduleDef = InjectorMetadata.getModuleDef(metatype, false);
      } else { // ModuleMetadata case
        dynamicDef = undefined;
        moduleDef = metatype as ModuleMetadata;
      }
    }

    if (moduleDef === undefined && dynamicDef === undefined) {
      throw new Error(`Given value/type ${metatype} cannot be used as ADI Module`);
    }

    // EMPTY_OBJECT is for case when someone pass the object as module
    return { type: metatype as Type, moduleDef: moduleDef || EMPTY_OBJECT, dynamicDef, injector: undefined, exportTo: undefined, isProxy: false };
  }

  // injector is here for searching in his parent and more depper
  private findModule(injector: Injector, type: Type, id: ModuleID): Injector | undefined | never {
    if (type === injector.metatype) {
      // TODO: Check this statement - maybe error isn't needed
      // throw Error('Cannot import this same module to injector');
      console.log('Cannot import this same module to injector');
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

  initModules(stack: Array<Injector>): void {
    for (let i = stack.length - 1; i > -1; i--) {
      stack[i].init();
    }
  }

  async initModulesAsync(stack: Array<Injector>): Promise<void> {
    for (let i = stack.length - 1; i > -1; i--) {
      await stack[i].init(this.asyncInitOptions);
    }
  }
}

export const Compiler = new ModuleCompiler();
