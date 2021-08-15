import { applyProviderDef } from "./injectable";
import { ComponentDef, ComponentOptions, Type } from "../interfaces";
import { Reflection } from "../utils";

export function Component<S>(options: ComponentOptions<S> = {}) {
  return function(target: Object) {
    applyComponentDef(target, options);
    const params = Reflection.getOwnMetadata("design:paramtypes", target);
    applyProviderDef(target, params, { scope: options.scope });
  }
}

export function componentMixin<T, S>(clazz: Type<T>, options?: ComponentOptions<S>): Type<T> {
  Component(options)(clazz);
  return clazz;
}

export function getComponentDef(injector: unknown): ComponentDef | undefined {
  return injector['$$comp'] || undefined;
}

function applyComponentDef(component: Object, options: ComponentOptions<any> = {}): ComponentDef {
  if (!component.hasOwnProperty('$$comp')) {
    Object.defineProperty(component, '$$comp', { value: options, enumerable: true });
  }
  return component['$$comp'];
}
