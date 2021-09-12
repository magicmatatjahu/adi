import { Context, InjectionToken } from "./injector";
import { InjectorOptions, InjectorScopeType } from "./interfaces";
import { Optional, Self } from "./wrappers";

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

export const ANNOTATIONS = {
  NAME: '@adi/name',
  NAMED: '@adi/named',
  EAGER: '@adi/eager',
  EXPORT: '@adi/export',
  ORDER: '@adi/order',
  LOCAL_SCOPE: '@adi/local-scope',
};

export const DELEGATION = {
  KEY: '@adi/delegation',
};

export const ALWAYS_CONSTRAINT = () => true;
export const NEVER_CONSTRAINT = () => false;

export const NULL_REF = {};
export const EMPTY_OBJECT = {};
export const EMPTY_ARRAY = [];
export const NOOP_FN = () => {}; 

export const SESSION_INTERNAL = {
  CIRCULAR: '$$circular',
  START_CIRCULAR: '$$startCircular',
  ON_INIT_HOOKS: '$$onInitHooks',
  ON_DESTROY_HOOKS: '$$onDestroyHooks',
}

export const COMMON_HOOKS = {
  OptionalSelf: Optional(Self()),
}
