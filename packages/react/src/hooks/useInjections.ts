import { useEffect, useRef } from "react";

import { DestroyManager, InjectionItem, InstanceRecord } from "@adi/core";

import { injectArray } from "../utils";
import { useInjector } from "./useInjector";

export function useInjections<A>(item: InjectionItem<A>): [A];
export function useInjections<A, B>(itemA: InjectionItem<A>, itemB: InjectionItem<B>): [A, B];
export function useInjections<A, B, C>(itemA: InjectionItem<A>, itemB: InjectionItem<B>, itemC: InjectionItem<C>): [A, B, C];
export function useInjections<A, B, C, D>(itemA: InjectionItem<A>, itemB: InjectionItem<B>, itemC: InjectionItem<C>, itemD: InjectionItem<D>): [A, B, C, D];
export function useInjections<A, B, C, D, E>(itemA: InjectionItem<A>, itemB: InjectionItem<B>, itemC: InjectionItem<C>, itemD: InjectionItem<D>, itemE: InjectionItem<E>): [A, B, C, D, E];
export function useInjections<A, B, C, D, E, F>(itemA: InjectionItem<A>, itemB: InjectionItem<B>, itemC: InjectionItem<C>, itemD: InjectionItem<D>, itemE: InjectionItem<E>, itemF: InjectionItem<F>): [A, B, C, D, E, F];
export function useInjections<A, B, C, D, E, F, G>(itemA: InjectionItem<A>, itemB: InjectionItem<B>, itemC: InjectionItem<C>, itemD: InjectionItem<D>, itemE: InjectionItem<E>, itemF: InjectionItem<F>, itemG: InjectionItem<G>): [A, B, C, D, E, F, G];
export function useInjections<A, B, C, D, E, F, G, H>(itemA: InjectionItem<A>, itemB: InjectionItem<B>, itemC: InjectionItem<C>, itemD: InjectionItem<D>, itemE: InjectionItem<E>, itemF: InjectionItem<F>, itemG: InjectionItem<G>, itemH: InjectionItem<H>): [A, B, C, D, E, F, G, H];
export function useInjections(...injections: Array<InjectionItem>): any[] {
  const injector = useInjector();
  const instancesRef = useRef<InstanceRecord[]>(null);
  const valuesRef = useRef<any[]>(null);

  useEffect(() => {
    return () => {
      // change injector argument to undefined
      DestroyManager.destroyAll('default', instancesRef.current, injector);
      instancesRef.current = null;
      valuesRef.current = null;
    };
  }, []);

  if (injector === null) {
    throw new Error();
  }

  if (instancesRef.current) return valuesRef.current;
  const result = injectArray(injector, injections);
  instancesRef.current = result.instances;
  return (valuesRef.current = result.values);
}
