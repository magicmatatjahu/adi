import { Context } from "./injector";
import { InjectionToken } from "./tokens";

import type { InjectorInput, InjectorOptions } from "./interfaces";

export const MODULE_REF = new InjectionToken<InjectorInput>(undefined, "adi:token:module-ref");
export const INJECTOR_CONFIG = new InjectionToken<InjectorOptions>({}, "adi:token:injector-config");
export const INITIALIZERS = new InjectionToken<void>(undefined, 'adi:token:initializers');

export const STATIC_CONTEXT = new Context(undefined, 'adi:context:static');
