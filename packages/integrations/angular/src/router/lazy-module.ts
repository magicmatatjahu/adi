import { Injector } from '@adi/core';
import { inject } from '@angular/core';

import { provideInjector } from '../standalone-features';
import { ROUTE_INIT_INJECTOR } from '../constants';

import type { InjectorInput, InjectorOptions } from '@adi/core';
import type { Route } from '@angular/router'
import type { AdiModule } from '../tokens'

export type LazyModuleInput = {
  route: Route, 
  input?: Injector | InjectorInput, 
  options?: InjectorOptions,
  provide: AdiModule[]
}

export function lazyModule(ctx: LazyModuleInput): Route {
  const { route, input, options, provide } = ctx;
  const { providers = [], resolve = {} } = route;

  return {
    ...route,
    providers: [
      ...providers,
      ...provideInjector(input, options, ...provide)
    ],
    resolve: {
      ...resolve,
      [ROUTE_INIT_INJECTOR]: () => initInjector()
    }
  }
}

function initInjector(): Injector | Promise<Injector> | undefined {
  const injector = inject(Injector)
  if (injector) {
    return injector.init()
  }
}
