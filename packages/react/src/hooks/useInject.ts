import { useEffect, useState } from "react";
import { destroy, serializeInjectArguments } from "@adi/core/lib/injector";

import { useInjector } from './useInjector';
import { inject, useDestroy } from "../utils";

import type { ProviderToken, ProviderInstance, InjectionHook, InjectionAnnotations } from "@adi/core";

export function useInject<T = any>(token: ProviderToken<T>, annotations?: InjectionAnnotations): T;
export function useInject<T = any>(token: ProviderToken<T>, hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations): T;
export function useInject<T = any>(token: ProviderToken<T>, hooks?: Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations): T {
  const injector = useInjector();
  const [instance] = useState<{ value: any, instance: ProviderInstance }>(() => {
    const injectArg = serializeInjectArguments(token as ProviderToken<T>, hooks as Array<InjectionHook>, annotations);
    return inject(injector, injectArg);
  });

  useDestroy(instance.instance);
  return instance.value;
}
