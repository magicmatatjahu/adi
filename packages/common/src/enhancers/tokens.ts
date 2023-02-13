import { InjectionToken } from "@adi/core";

import type { Interceptor, Guard, ExceptionHandler, PipeTransform } from './interfaces';

export const INTERCEPTORS = new InjectionToken<Interceptor>(undefined, "adi:token:interceptors");
export const GUARDS = new InjectionToken<Guard>(undefined, "adi:token:guards");
export const EXCEPTION_HANDLERS = new InjectionToken<ExceptionHandler>(undefined, "adi:token:exception-handlers");
export const PIPES = new InjectionToken<PipeTransform>(undefined, "adi:token:pipes");
