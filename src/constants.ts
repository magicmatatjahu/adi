import { Context, InjectionToken } from "./injector";
import { InjectorScopeType } from "./interfaces";

export const STATIC_CONTEXT = new Context({}, "STATIC_CONTEXT");

export const INJECTOR_SCOPE = new InjectionToken<InjectorScopeType | Array<InjectorScopeType>>({
  providedIn: "any",
  useValue: "any",
}, "INJECTOR_SCOPE");

export const MODULE_INITIALIZERS = new InjectionToken<any>({
  providedIn: "any",
  useValue: [],
}, "MODULE_INITIALIZERS");

export const CONSTRAINTS = {
  NAMED: '$$named',
}

export const NOOP_CONSTRAINT = () => true;
export const TRUE_CONSTRAINT = () => true;
export const FALSE_CONSTRAINT = () => false;
