import { All, InjectionToken, Optional } from "@adi/core";

import type { Guard, Interceptor, PipeTransform, ExceptionHandler } from './types';

const hooks = [Optional(), All()];

export const GUARDS = InjectionToken.provide<Guard>({ hooks }, { name: "adi:token:guards" });
export const INTERCEPTORS = InjectionToken.provide<Interceptor>({ hooks }, { name: "adi:token:interceptors" });
export const PIPES = InjectionToken.provide<PipeTransform>({ hooks }, { name: "adi:token:pipes" });
export const EXCEPTION_HANDLERS = InjectionToken.provide<ExceptionHandler>({ hooks }, { name: "adi:token:exception-handlers" });
