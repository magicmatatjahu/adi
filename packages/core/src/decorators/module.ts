import { applyProviderDef } from "./injectable";
import { ModuleDef, ModuleMetadata, Type } from "../interfaces";
import { Reflection } from "../utils";
import { Scope } from "../scope";
import { PRIVATE_METADATA, METADATA, EMPTY_ARRAY } from "../constants";

export function Module(metadata?: ModuleMetadata) {
  return function(target: Object) {
    applyModuleDef(target, metadata);
    const params = Reflection.getOwnMetadata("design:paramtypes", target);
    applyProviderDef(target, params, { scope: Scope.SINGLETON });
  }
}

export function moduleMixin<T>(clazz: Type<T>, metadata?: ModuleMetadata): Type<T> {
  Module(metadata)(clazz);
  return clazz;
}

export function getModuleDef(injector: unknown): ModuleDef | undefined {
  return injector[PRIVATE_METADATA.MODULE] || undefined;
}

export function applyModuleDef(target: Object, moduleMetadata: ModuleMetadata = {}): ModuleDef {
  if (!target.hasOwnProperty(PRIVATE_METADATA.MODULE)) {
    const metadata = { ...moduleMetadata };

    // merge inline metadata
    const inlineMetadata = target[METADATA.MODULE] as ModuleMetadata;
    if (inlineMetadata !== undefined) {
      metadata.imports = [...(metadata.imports || EMPTY_ARRAY), ...(inlineMetadata.imports || EMPTY_ARRAY)];
      metadata.components = [...(metadata.components || EMPTY_ARRAY), ...(inlineMetadata.components || EMPTY_ARRAY)];
      metadata.providers = [...(metadata.providers || EMPTY_ARRAY), ...(inlineMetadata.providers || EMPTY_ARRAY)];
      metadata.exports = [...(metadata.exports || EMPTY_ARRAY), ...(inlineMetadata.exports || EMPTY_ARRAY)];
    }

    Object.defineProperty(target, PRIVATE_METADATA.MODULE, { value: metadata, enumerable: true });
  }
  return target[PRIVATE_METADATA.MODULE];
}