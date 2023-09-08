import { useContext, useEffect, useMemo, useRef } from 'react';
import { Injector } from '@adi/core';
import { getInjectionHookDef } from "@adi/core/lib/hooks/private";

import { InjectorContext } from '../context';
import { destroyInjector, destroyInstances } from '../utils';
import { dequalLite } from '../dequal-lite';

import type { ProviderInstance, InjectionAnnotations, InjectionHook, InjectionHookDefinition, InjectorInput, InjectorOptions } from '@adi/core'

export function useInjectorContext() {
  return useContext(InjectorContext)
}

export function useCachedInjectorInput(input: InjectorInput | Injector): InjectorInput | Injector {
  const signalRef = useRef<any>(undefined)

  if (input instanceof Injector) {
    signalRef.current = input
  } else if (signalRef.current !== undefined) { // is annotations - object
    if (dequalLite(signalRef.current, input) === false) {
      signalRef.current = input;
    }
  } else {
    signalRef.current = input
  }

  return useMemo(() => input, [signalRef.current])
}

export function useCachedInjectorOptions(options: InjectorOptions | undefined): InjectorOptions | undefined {
  const signalRef = useRef<any>(undefined)

  if (!options) {
    signalRef.current = undefined
  } else if (signalRef.current !== undefined) { // is annotations - object
    if (dequalLite(signalRef.current, options) === false) {
      signalRef.current = options;
    }
  } else {
    signalRef.current = options
  }

  return useMemo(() => options, [signalRef.current])
}

export function useCachedAnnotations(annotations: InjectionAnnotations | InjectionHook | undefined): InjectionAnnotations | InjectionHook | undefined {
  const signalRef = useRef<any>(undefined)

  let hookDef: InjectionHookDefinition | undefined
  if (!annotations) {
    signalRef.current = undefined
  } else if (hookDef = getInjectionHookDef(annotations)) { // is hook
    // use name of hook (function) if name is not passed in hook options
    signalRef.current = hookDef.options?.name || (annotations as InjectionHook).name;
  } else if (signalRef.current !== undefined) { // is annotations - object
    if (dequalLite(signalRef.current, annotations) === false) {
      signalRef.current = annotations;
    }
  } else {
    signalRef.current = annotations
  }

  return useMemo(() => annotations, [signalRef.current])
}

export function useCachedHooks(hooks: Array<InjectionHook> | undefined): Array<InjectionHook> | undefined {
  const signalRef = useRef<undefined | Array<string | undefined>>(undefined)

  if (!hooks || hooks.length === 0) {
    signalRef.current = undefined
  } else if (signalRef.current !== undefined) {
    const currentNames = signalRef.current;
    const newNames = hooks.map(getHookName);
    if (equalArray(currentNames, newNames) === false) {
      signalRef.current = newNames;
    }
  } else {
    signalRef.current = hooks.map(getHookName);
  }

  return useMemo(() => hooks, [signalRef.current])
}

function getHookName(hook: InjectionHook | undefined): string | undefined {
  return getInjectionHookDef(hook)?.options?.name;
}

function equalArray(original: any[], toCompare: any[]): boolean {
  for (let i = 0, l = original.length; i < l; ++i) {
    if (original[i] !== toCompare[i]) {
      return false;
    }
  }
  return true;
}

export function useDestroyInstances(toDestroy: Array<ProviderInstance>): void {
  useEffect(() => {
    return () => destroyInstances(toDestroy)
  }, [toDestroy]);
}

export function useDestroyInjector(toDestroy?: Injector | Promise<Injector>): void {
  useEffect(() => {
    return () => destroyInjector(toDestroy)
  }, [toDestroy]);
}
