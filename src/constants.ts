import { Context, InjectionToken } from "./injector";
import { InjectorOptions, InjectorScopeType } from "./interfaces";

export const STATIC_CONTEXT = new Context({}, "STATIC_CONTEXT");

export const INJECTOR_SCOPE = new InjectionToken<InjectorScopeType | Array<InjectorScopeType>>({
  providedIn: "any",
  useValue: undefined,
}, "INJECTOR_SCOPE");

export const INJECTOR_OPTIONS = new InjectionToken<InjectorOptions>({
  providedIn: "any",
  useValue: undefined,
}, "INJECTOR_OPTIONS");

export const MODULE_INITIALIZERS = new InjectionToken<any>({
  providedIn: 'any',
  useFactory() { return [] },
}, "MODULE_INITIALIZERS");

export const CONSTRAINTS = {
  NAMED: '$$named',
}

export const NOOP_CONSTRAINT = () => true;
export const ALWAYS_CONSTRAINT = () => true;
export const NEVER_CONSTRAINT = () => false;
