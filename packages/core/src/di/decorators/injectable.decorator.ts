import { applyProviderDef, applyFactoryDef } from "../definitions";
import { InjectableOptions, Type } from "../interfaces";
import { InjectionToken } from "../tokens";
import { Token } from "../types";
import { Reflection } from "../utils";

export function Injectable(options?: InjectableOptions);
export function Injectable<T = any>(token?: Token<T>);
export function Injectable(optionsOrToken?: InjectableOptions | Token, options?: InjectableOptions) {
  return function(target: Object, key?: string, descriptor?: PropertyDescriptor) {
    if (descriptor === undefined) {
      // class decorator case
      const params = Reflection.getOwnMetadata("design:paramtypes", target);
      applyProviderDef(target, params, optionsOrToken as InjectableOptions);
    } else {
      // static method case
      if ((target as any).prototype === undefined) {
        throw new Error("@Injectable can be used only on class and static methods");
      }
      const params = Reflection.getOwnMetadata("design:paramtypes", target, key);
      if (typeof optionsOrToken === "object" && !(optionsOrToken instanceof InjectionToken)) {
        options = optionsOrToken;
        optionsOrToken = Reflection.getOwnMetadata("design:returntype", target, key);
      }
      applyFactoryDef(target[key], optionsOrToken as Token, params, options);
    }
  }
}

export function injectableMixin<T>(clazz: Type<T>): Type<T> {
  Injectable()(clazz);
  return clazz;
}
