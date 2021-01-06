import { 
  ModuleMeta,
  ModuleDef,
} from "../interfaces"
import { DEFINITIONS } from "../constants";
import { ModuleType } from "../enums";

export function getModuleDef<T>(injector: unknown): ModuleDef<T> | undefined {
  return injector[DEFINITIONS.MODULE] || undefined;
}

// modules don't support inheritance
export function applyModuleDef<T>(target: Object, metadata: ModuleMeta = {}): ModuleDef<T> {
  metadata.type = metadata.type || ModuleType.SHARED;
  return Object.defineProperty(target, DEFINITIONS.MODULE, { value: metadata, enumerable: true })
}
