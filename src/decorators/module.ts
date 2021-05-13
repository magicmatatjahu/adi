import { applyProviderDef } from "./injectable";
import { ModuleDef, ModuleMetadata, Type } from "../interfaces";
import { Reflection } from "../utils";
import { Scope } from "../scope";

export function Module(metadata?: ModuleMetadata) {
  return function(target: Object) {
    applyModuleDef(target, metadata);
    // applyComponentDef(target, "module");
    const params = Reflection.getOwnMetadata("design:paramtypes", target);
    applyProviderDef(target, params, { scope: Scope.SINGLETON });
  }
}

export function moduleMixin<T>(clazz: Type<T>, metadata?: ModuleMetadata): Type<T> {
  Module(metadata)(clazz);
  return clazz;
}

export function getModuleDef<T>(injector: unknown): ModuleDef | undefined {
  return injector['$$module'] || undefined;
}

// modules don't support inheritance
function applyModuleDef<T>(target: Object, metadata: ModuleMetadata = {}): ModuleDef {
  // metadata.type = metadata.type || ModuleType.SHARED;
  return Object.defineProperty(target, '$$module', { value: metadata, enumerable: true })
}
