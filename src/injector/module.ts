import { getModuleDef } from "../decorators";
import {
  Type,
  ModuleMetadata,
  DynamicModule,
  ForwardRef,
} from "../interfaces"
import { resolveRef } from "../utils";
import { EMPTY_ARRAY } from '../constants';

export class Module<T = any> {
  private readonly _id: string;
  private readonly _module: Type<T> | ModuleMetadata | DynamicModule<T> | Promise<DynamicModule> | ForwardRef<T>;

  // make option to run it as sync
  process() {
  }

  // make option to run it as sync
  processImport() {

  }

  // make option to run it as sync
  async compileMetadata() {
    let mod = resolveRef(this._module);
    if (!mod) return;

    // retrieve module metadata
    // if it's dynamic module, first try to resolve the module metadata
    let moduleDef = getModuleDef(mod), 
      dynamicDef: DynamicModule<T> = undefined;
    if (moduleDef === undefined) {
      dynamicDef = await (mod as Promise<DynamicModule>);
      mod = dynamicDef.module;
      if (mod !== undefined) {
        moduleDef = getModuleDef(mod);
      }
    }

    if (moduleDef === undefined && dynamicDef === undefined) {
      throw new Error(`Given value/type ${mod} cannot be used as ADI Module`);
    }
  }
}
