import { useState } from "react";

import { useInjector } from "./useInjector";
import { injectArray, useDestroy } from "../utils";

import type { InjectionItem, ProviderInstance } from "@adi/core";

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
  const [instances] = useState<{ values: Array<any>, instances: Array<ProviderInstance> }>(() => {
    return injectArray(injector, injections);
  });

  useDestroy(instances.instances);
  return instances.values;
}
