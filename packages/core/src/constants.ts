import { InjectionToken } from "./tokens";

import type { InjectorInput, InjectorOptions } from "./types";

export const MODULE_REF = InjectionToken.create<InjectorInput>({ name: "adi:module-ref" });
export const INJECTOR_OPTIONS = InjectionToken.create<InjectorOptions>({ name: "adi:injector-options" });
export const INITIALIZERS = InjectionToken.create<void>({ name: 'adi:initializers' });

