import { createElement, useState, useMemo, useRef } from "react";
import { waitAll } from "@adi/core";

import { createInjectionMetadata } from "@adi/core/lib/injector";
import { convertInjection } from "@adi/core/lib/injector/metadata";
import { optimizedInject } from "@adi/core/lib/injector/resolver";
import { getAllKeys, wait, isPromiseLike } from "@adi/core/lib/utils";
import { InjectionKind } from "@adi/core/lib/enums";

import { SuspenseError } from '../errors';
import { useDestroyInstances, useInjector } from "../hooks";
import { destroyInstances, handleProviderSuspense } from "../utils";

import type { ReactNode } from 'react'
import type { ClassType, Injector, InjectionArgument, InjectionItem, InjectionContext, ProviderInstance, InjectionMetadata } from "@adi/core";
import type { SuspensePromise } from "../utils";

export type WithInjectionsOptions = {
  displayName?: string
  fallback?: ReactNode;
}

export function withInjections<TProps, TInjectedKeys extends keyof TProps>(
  Component: React.JSXElementConstructor<TProps>,
  injections: Record<keyof Pick<TProps, TInjectedKeys>, InjectionItem>,
  options: WithInjectionsOptions = {},
) {
  const isSuspense = options.fallback === undefined;
  const fallback = options.fallback === undefined ? null : options.fallback;
  
  function ComponentWithInjection(props: Omit<TProps, TInjectedKeys>) {
    const injector = useInjector()
    const instancesRef = useRef<{ instances: Record<string | symbol, any>, asyncOperations: Promise<any>[], toDestroy: ProviderInstance[] }>();

    const result = useMemo(() => {
      const result = injectMap(injector, injections, Component, isSuspense);
  
      const current = instancesRef.current
      if (current !== undefined && current.toDestroy) {
        destroyInstances(current.toDestroy)
      }
  
      return instancesRef.current = result
    }, [injector, instancesRef]);

    useDestroyInstances(result.toDestroy);
    
    const [, hardRender] = useState(false);

    const asyncOperations = result.asyncOperations;
    if (isSuspense === false && asyncOperations.length) {
      waitAll(
        asyncOperations,
        () => {
          result.asyncOperations = [];
          hardRender(prev => !prev);
        }
      )

      return fallback;
    }

    return createElement(Component, { ...(props as TProps), ...result.instances });
  };

  ComponentWithInjection.displayName = options.displayName || 'ComponentWithInjection'
  return ComponentWithInjection;
}

function injectMap(injector: Injector, injections: Record<string | symbol, InjectionItem>, target: ClassType | Function, isSuspense: boolean) {
  const { args, metadata } = convertMapInjections(injections, target);

  const instances: Record<string | symbol, any> = {};
  const asyncOperations: Array<Promise<unknown>> = [];
  const toDestroy: ProviderInstance[] = [];
  const ctx: InjectionContext = { 
    injector,
    session: undefined,
    current: undefined,
    metadata,
    toDestroy,
  }

  if (isSuspense) {
    getAllKeys(args).forEach(key => {
      const argument = args[key];
      const suspense = argument.annotations.suspense;
  
      let instance: any
      if (suspense) {
        instance = handleProviderSuspense(injector, ctx, suspense);
      }
  
      if (instance === undefined) {
        instance = optimizedInject(injector, undefined, argument, ctx);
        if (ctx.current?.hasFlag('async')) {
          if (suspense) {
            instance = handleProviderSuspense(injector, ctx, suspense, instance as SuspensePromise);
          } else {
            throw new SuspenseError()
          }
        }
      }
  
      instances[key] = instance;
    });
  
    return { instances, toDestroy, asyncOperations }
  }

  getAllKeys(args).forEach(key => {
    const argument = args[key];
    const injection = instances[key] = optimizedInject(injector, undefined, argument, ctx);

    if (isPromiseLike(injection)) {
      asyncOperations.push(
        wait(
          injection,
          result => instances[key] = result
        ) as Promise<unknown>
      )
    }
  });

  return { instances, toDestroy, asyncOperations }
}

function convertMapInjections(injections: Record<string | symbol, InjectionItem>, target: ClassType | Function): {
  metadata: InjectionMetadata,
  args: Record<string | symbol, InjectionArgument>,
} {
  const metadata = createInjectionMetadata({
    kind: InjectionKind.CUSTOM,
    target,
  })

  const args: Record<string | symbol, InjectionArgument> = {}
  getAllKeys(injections).forEach(key => {
    args[key] = convertInjection(injections[key], { ...metadata });
  });

  return {
    metadata,
    args,
  };
}
