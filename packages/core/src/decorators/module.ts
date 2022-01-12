import { applyProviderDef } from "./injectable";
import { ModuleDef, ModuleMetadata, Type } from "../interfaces";
import { Scope } from "../scope";
import { PRIVATE_METADATA, METADATA, EMPTY_ARRAY } from "../constants";

export function Module(metadata?: ModuleMetadata) {
  return function(target: Object) {
    applyModuleDef(target, metadata);
    applyProviderDef(target, { scope: Scope.SINGLETON });
  }
}

export function moduleMixin<T>(target: Type<T>, metadata?: ModuleMetadata): Type<T> {
  applyModuleDef(target, metadata);
  applyProviderDef(target, { scope: Scope.SINGLETON });
  return target;
}

export function getModuleDef(mod: unknown): ModuleDef | undefined {
  if (mod && mod.hasOwnProperty(PRIVATE_METADATA.MODULE)) {
    return mod[PRIVATE_METADATA.MODULE];
  }
  return;
}

export function applyModuleDef(target: Object, moduleMetadata: ModuleMetadata = {}): ModuleDef | undefined {
  if (typeof target !== 'function') return;
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
