import { InjectionToken } from "./tokens";

import type { InjectorInput, InjectorOptions } from "./types";

export const MODULE_REF = InjectionToken.create<InjectorInput>({ name: "adi:module-ref" });
export const INJECTOR_CONFIG = InjectionToken.create<InjectorOptions>({ name: "adi:injector-config" });
export const INITIALIZERS = InjectionToken.create<void>({ name: 'adi:initializers' });

