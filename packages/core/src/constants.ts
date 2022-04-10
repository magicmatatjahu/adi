import { Context } from "./injector/context";
import { InjectionToken } from "./injector/injection-token";

import type { InjectorOptions } from "./interfaces";

export const ADI_INJECTABLE_DEF = Symbol.for('adi:definition:injectable');
export const ADI_MODULE_DEF = Symbol.for('adi:definition:module');
export const ADI_HOOK_DEF = Symbol.for('adi:definition:hook');
export const ADI_REFLECTION = Symbol.for('adi:reflection');

export const STATIC_CONTEXT = new Context({}, "adi:static_context");

export const INJECTOR_CONFIG = new InjectionToken<InjectorOptions>({}, "adi:token:injector_config");
export const INITIALIZERS = new InjectionToken<void>({}, 'adi:token:initializers');
export const MODULE_REF = new InjectionToken<any>({}, "adi:token:module_ref");
