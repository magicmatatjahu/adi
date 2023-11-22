import { InjectionToken } from "./tokens";

import type { InjectorInput, InjectorOptions } from "./types";

export const INJECTABLE_DEF = Symbol.for('adi:definition:injectable-standalone');
export const MODULE_DEF = Symbol.for('adi:definition:module-standalone');
export const MODULE_REF = InjectionToken.create<InjectorInput>({ name: "adi:module-ref" });
export const INJECTOR_OPTIONS = InjectionToken.create<InjectorOptions>({ name: "adi:injector-options" });
export const INITIALIZERS = InjectionToken.create<void>({ name: 'adi:initializers' });

