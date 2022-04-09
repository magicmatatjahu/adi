import { injectableMixin, getInjectableDefinition } from "./injectable";
import { ADI_MODULE_DEF } from "../constants";

import type { ModuleMetadata } from "../interfaces";

export function Module(metadata?: ModuleMetadata) {
  return function(target: Function) {
    injectableMixin(target, {});
    moduleMixin(target, metadata);
  }
}

export function moduleMixin(target: Function, metadata: ModuleMetadata): void {
  const def = getInjectableDefinition(target);
  if (def === undefined) return;
  def.meta[ADI_MODULE_DEF] = metadata;
}

export function getModuleDefinition(module: unknown): ModuleMetadata | undefined {
  const def = getInjectableDefinition(module);
  if (def === undefined) return;
  return def.meta[ADI_MODULE_DEF];
}
