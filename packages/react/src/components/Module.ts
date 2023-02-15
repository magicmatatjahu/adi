import { wait, Injector, InjectorInput } from "@adi/core";
import { isPromiseLike } from "@adi/core/lib/utils/wait";
import { useContext, useEffect, useState } from "react";

import { InjectorContext, createProvider } from "../context";

import type { FunctionComponent, PropsWithChildren, ReactNode } from "react";
import type { InjectorOptions } from "@adi/core";

type InternalState = [Injector | Promise<Injector>, boolean];

export interface ModuleProps {
  module: InjectorInput | Injector;
  options?: InjectorOptions;
  cacheId?: string | symbol;
  fallback?: ReactNode;
}

export const Module: FunctionComponent<PropsWithChildren<ModuleProps>> = (props) => {
  const ctx = useContext(InjectorContext);
  const [[injector, isAsync], setState] = useState(() => {
    return createInjector(props, ctx?.injector);
  });

  useEffect(() => {
    if (isAsync) {
      wait(injector, inj => setState([inj, false]));
    }

    if (props.cacheId === undefined) {
      return () => destroyInjector(injector);
    }
  }, []);

  if (isAsync) {
    const fallback = props.fallback;
    return fallback ? fallback : null as any;
  }

  return createProvider(injector as Injector, props.children);
}

const cache: Map<string | symbol, Injector> = new Map();
function createInjector(props: ModuleProps, parentInjector: Injector | undefined): InternalState {
  let isAsync: boolean = false;

  const mod = props.module || [];
  let injector: Injector | Promise<Injector>;
  if (mod instanceof Injector) {
    injector = mod;
  }

  const cacheId = props.cacheId;
  if (!injector) {
    if (cache.has(cacheId)) {
      return [cache.get(cacheId), isAsync];
    }

    const options = props.options || {};
    options.exporting = 'disabled';
    injector = Injector.create(mod as InjectorInput, options, parentInjector || undefined).init();
  }

  if (isPromiseLike(injector)) {
    isAsync = true;
  }

  if (cacheId !== undefined && !cache.has(cacheId)) {
    if (isAsync) {
      // save temporary value to persiste the cache id for future processing
      cache.set(cacheId, null);
      wait(injector, inj => cache.set(cacheId, inj));
    } else {
      cache.set(cacheId, injector as Injector);
    }
  }

  return [injector, isAsync];
}

function destroyInjector(injector: Injector | Promise<Injector>) {
  // use setTimeout to add destruction to the end of event loop
  setTimeout(() => {
    wait(injector, inj => inj.destroy());
  }, 0);
}
