import { Injector } from "./injector";
import { NilInjector } from "./nil-injector";
import { InjectorImpl } from "./implementation";

import { INJECTOR_SCOPE } from "../providers";
import { Type, Provider, ModuleMeta } from "../interfaces";

let nilInjector: NilInjector = new NilInjector();
export function getNilInjector(): NilInjector {
  return nilInjector || (nilInjector = new NilInjector());
}

let coreInjector: Injector | undefined = undefined;
export function getCoreInjector(): Injector {
  return coreInjector || (coreInjector = createInjector([
    { provide: INJECTOR_SCOPE, useValue: "core" },
  ], getNilInjector() as any));
}

export function createInjector(
  injector: Type<any> | ModuleMeta | Array<Provider>,
  parent: Injector | undefined = getCoreInjector(),
  setupProviders?: Array<Provider>,
): Injector {
  const inj = Array.isArray(injector) ? { providers: injector } : injector;
  return new InjectorImpl(inj as ModuleMeta, parent, setupProviders);
}
