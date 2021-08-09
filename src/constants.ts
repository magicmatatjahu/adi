import { Context, InjectionToken } from "./injector";
import { InjectorOptions, InjectorScopeType } from "./interfaces";
import { Multi } from "./wrappers";

export const STATIC_CONTEXT = new Context({}, "STATIC_CONTEXT");

export const INJECTOR_SCOPE = new InjectionToken<InjectorScopeType | Array<InjectorScopeType>>({
  provideIn: "any",
  useValue: undefined,
}, "INJECTOR_SCOPE");

export const INJECTOR_OPTIONS = new InjectionToken<InjectorOptions>({
  provideIn: "any",
  useValue: undefined,
}, "INJECTOR_OPTIONS");

export const MODULE_INITIALIZERS = new InjectionToken<any>({}, "MODULE_INITIALIZERS");

export const CONSTRAINTS = {
  NAMED: '$$named',
}

export const ALWAYS_CONSTRAINT = () => true;
export const NEVER_CONSTRAINT = () => false;

export const EMPTY_OBJECT = {};
export const EMPTY_ARRAY = [];
