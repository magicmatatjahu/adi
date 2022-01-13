import { useEffect, useRef } from "react";

import { ProviderToken, Annotations, InstanceRecord, Wrapper } from "@adi/core";
import { destroy } from "@adi/core/lib/injector";
import { isWrapper } from "@adi/core/lib/utils/wrappers";

import { wrap } from "../utils";
import { useInjector } from "./useInjector";
import { NotFoundInjectorException } from "../exceptions";

export function useInject<T = any>(token: ProviderToken<T>, annotations?: Annotations): T;
export function useInject<T = any>(token: ProviderToken<T>, hook?: Wrapper | Array<Wrapper>, annotations?: Annotations): T;
export function useInject<T = any>(token: ProviderToken<T>, hook?: Wrapper | Array<Wrapper> | Annotations, annotations?: Annotations): T {
  const injector = useInjector();
  const instanceRef = useRef<InstanceRecord>(null);
  const valueRef = useRef<T>(null);

  useEffect(() => {
    return () => {
      // use setTimeout to add destruction to the end of event loop
      setTimeout(() => {
        destroy(instanceRef.current, 'default');
        instanceRef.current = null;
        valueRef.current = null;
      }, 0);
    };
  }, []);

  if (injector === null) {
    throw new NotFoundInjectorException();
  }

  if (instanceRef.current) return valueRef.current;
  const [retrievedHook, retrievedAnnotations] = retrieveArguments(hook, annotations);
  const [value, instance] = injector.get<[T, InstanceRecord<T>]>(token as any, wrap(retrievedHook), retrievedAnnotations as any);
  instanceRef.current = instance;
  return (valueRef.current = value);
}

function retrieveArguments(hook?: Wrapper | Array<Wrapper> | Annotations, annotations?: Annotations): [Wrapper | Array<Wrapper>, Annotations] {
  if (typeof hook === 'object' && !isWrapper(hook)) {
    annotations = hook as Annotations;
    hook = undefined;
  }
  return [hook as Wrapper | Array<Wrapper>, annotations];
}