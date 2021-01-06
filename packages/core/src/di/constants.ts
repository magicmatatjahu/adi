import { Type } from "./interfaces";
import { Scope } from "./scopes";
import { InjectionToken, Context } from "./tokens";

// PUBLIC

export const CUSTOM_SCOPES = new InjectionToken<Scope>({ multi: true });

export const STATIC_CONTEXT = new Context(undefined, 0, "STATIC");
export const INJECTOR_SCOPE = new InjectionToken<string | symbol | Type>();
export const INJECTOR_ID = new InjectionToken<string>();
export const MODULE_INITIALIZERS = new InjectionToken<() => Promise<any> | any>({ multi: true });
export const CONTEXT = new InjectionToken<Context>();
export const INQUIRER = new InjectionToken<any>();
export const INQUIRER_PROTO = new InjectionToken<any>();

// PRIVATE

export const MODULE = new InjectionToken<Type>();
export const SHARED_MODULE = new Context();
export const INLINE_MODULE = new Context();
export const SPECIAL_TOKENS = [CONTEXT, INQUIRER, INQUIRER_PROTO];

export const DEFINITIONS = {
  MODULE: '_$mod',
  COMPONENT: '_$comp',
  PROVIDER: '_$prov',
};

export const EMPTY_OBJ = {};
export const EMPTY_ARR = [];
