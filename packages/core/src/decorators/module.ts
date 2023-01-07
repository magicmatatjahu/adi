import { injectableMixin, getInjectableDefinition } from "./injectable";
import { ADI_MODULE_DEF } from "../constants";

import type { ModuleMetadata } from "../interfaces";

export function Module(metadata?: ModuleMetadata) {
  return function(target: Function) {
    injectableMixin(target, {});
    moduleMixin(target, metadata);
  }
}

export function moduleMixin(target: Function, metadata?: ModuleMetadata): void {
  if (!target.hasOwnProperty(ADI_MODULE_DEF)) {
    Object.defineProperty(target, ADI_MODULE_DEF, { value: metadata || {}, enumerable: true });
  }
  // const def = getInjectableDefinition(target);
  // if (def === undefined) return;
  // def.meta[ADI_MODULE_DEF] = metadata;
}

export function getModuleDefinition(target: unknown): ModuleMetadata | undefined {
  if (target && target.hasOwnProperty(ADI_MODULE_DEF)) {
    return target[ADI_MODULE_DEF];
  }
  return;
}

// function setModuleMetadata(module: unknown, metadata: ModuleMetadata) {
//   if (!module.hasOwnProperty(ADI_MODULE_DEF)) {
//     Object.defineProperty(module, ADI_MODULE_DEF, { value: metadata, enumerable: true });
//   }
// }
