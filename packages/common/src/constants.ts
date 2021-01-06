import { InjectionToken } from "@adi/core";
import { PlatformRecord, ApplicationRecord } from "./interfaces";

export const PLATFORMS = new InjectionToken<PlatformRecord>({ multi: true });
export const APPLICATIONS = new InjectionToken<ApplicationRecord>({ multi: true });

export const PLATFORM_ID = new InjectionToken<string>();
export const APPLICATION_ID = new InjectionToken<string>();
