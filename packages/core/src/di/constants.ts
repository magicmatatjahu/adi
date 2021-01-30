import { InjectionSession, Type } from "./interfaces";
import { Scope } from "./scopes";
import { InjectionToken, Context } from "./tokens";

// PUBLIC

export const CUSTOM_SCOPES = new InjectionToken<Scope>({ multi: true });

export const STATIC_CONTEXT = new Context(undefined, 0, "STATIC");
export const INJECTOR_ID = new InjectionToken<string>();
export const CUSTOM_PROVIDER = new InjectionToken();

export const CONSTRAINTS = {
  NAMED: "named",
}

// PRIVATE

export const MODULE = new InjectionToken<Type>();
export const SHARED_MODULE = new Context();
export const INLINE_MODULE = new Context();

export const DEFINITIONS = {
  MODULE: '_$mod',
  COMPONENT: '_$comp',
  PROVIDER: '_$prov',
};

export const EMPTY_OBJ = {};
export const EMPTY_ARR = [];
