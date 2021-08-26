import { getModuleDef } from "../decorators";
import { Injector } from ".";
import {
  Type,
  ModuleMetadata,
  DynamicModule,
  ForwardRef,
  CompiledModule2,
} from "../interfaces"
import { resolveRef, thenable } from "../utils";
import { EMPTY_ARRAY } from "../constants";

export class ModuleCompiler {
  public process<T>({ moduleDef, dynamicDef, injector, exportTo, isProxy }: CompiledModule2, stack: Array<Injector>) {
    // for proxy performs only acitions on dynamicDef. Performing action when is facade on moduleDef might end up overwriting some providers
    const compiledModules: Array<CompiledModule2> = [];

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

  public async processAsync<T>({ moduleDef, dynamicDef, injector, exportTo, isProxy }: CompiledModule2, stack: Array<Injector>) {
    // for proxy performs only acitions on dynamicDef. Performing action when is facade on moduleDef might end up overwriting some providers
    const compiledModules: Array<CompiledModule2> = [];

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

  private async processImport<T = any>(
    imp: Type<T> | ModuleMetadata | DynamicModule<T> | Promise<DynamicModule> | ForwardRef<T>,
    compiledModules: Array<CompiledModule2>,
    parentInjector: Injector,
    stack: Array<Injector>,
  ) {

  }

  private compileMetadata<T>(
    metatype: Type<T> | ModuleMetadata | DynamicModule<T> | Promise<DynamicModule> | ForwardRef<T>
  ) {
    let mod = resolveRef(metatype);
    if (!mod) {
      return;
    }

    return thenable<any>(
      () => mod,
      this.extractMetadata,
    );
  }

  private extractMetadata<T>(metatype: Type<T> | DynamicModule<T>) {
    let moduleDef = getModuleDef(metatype), 
      dynamicDef: DynamicModule<T> = undefined;

    // DynamicModule case
    if (moduleDef === undefined) {
      metatype = dynamicDef.module;
      if (metatype !== undefined) {
        moduleDef = getModuleDef(metatype);
      }
    }

    if (moduleDef === undefined && dynamicDef === undefined) {
      throw new Error(`Given value/type ${metatype} cannot be used as ADI Module`);
    }

    return { mod: metatype as Type, moduleDef: moduleDef, dynamicDef, injector: undefined, exportTo: undefined, isProxy: false };
  }
}
