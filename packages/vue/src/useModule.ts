import { wait, Injector } from "@adi/core";
import { isPromiseLike } from "@adi/core/lib/utils/wait";
import { onScopeDispose, inject, provide } from 'vue-demi'

import { INJECTOR_KEY } from './keys';
import { assertEnv } from './utils';

import type { InjectorInput, InjectorOptions } from '@adi/core';

export interface ModuleOptions {
  options?: InjectorOptions;
  cacheId?: string | symbol;
}

export function useModule(input: InjectorInput | Injector, options?: ModuleOptions): void {
  assertEnv()
  const parentInjector = inject<Injector>(INJECTOR_KEY, null);
  const [injector, isAsync] = createInjector(input, options, parentInjector);

  if (options?.cacheId === undefined) {
    onScopeDispose(() => {
      provide(INJECTOR_KEY, null);
      destroyInjector(injector);
    });
  }
  provide(INJECTOR_KEY, injector);
}

const cache: Map<string | symbol, Injector> = new Map();
function createInjector(input: InjectorInput | Injector, options: ModuleOptions, parentInjector: Injector | null | undefined): [Injector | Promise<Injector>, boolean] {
  let isAsync: boolean = false;

  const mod = input || [];
  let injector: Injector | Promise<Injector>;
  if (mod instanceof Injector) {
    injector = mod;
  }

  const cacheId = options.cacheId;
  if (!injector) {
    if (cache.has(cacheId)) {
      return [cache.get(cacheId), isAsync];
    }

    const moduleOptions = options.options || {};
    moduleOptions.exporting = 'disabled';
    injector = Injector.create(mod as InjectorInput, moduleOptions, parentInjector || undefined).init();
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
