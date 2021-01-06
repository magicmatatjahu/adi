import { applyModuleDef, applyComponentDef, applyProviderDef } from "../definitions";
import { ModuleMeta } from "../interfaces";
import { Reflection } from "../utils";
import { Scope } from "../scopes";

export function Module(metadata?: ModuleMeta) {
  return function(target: Object) {
    applyModuleDef(target, metadata);
    applyComponentDef(target, "module");
    const params = Reflection.getOwnMetadata("design:paramtypes", target);
    applyProviderDef(target, params, { scope: Scope.SINGLETON });
  }
}
