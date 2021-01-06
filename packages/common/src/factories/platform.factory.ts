import { Injector, ModuleMeta, Type, Provider } from "@adi/core";
import { getCoreInjector } from "@adi/core/dist/src/di/injector";

import { injectorFactory } from "./injectorFactory.factory";

import { PLATFORM_ID, PLATFORMS } from "../constants";

export function createPlatform(id: string, module: Type<any> | ModuleMeta | Array<Provider> = [], parentInjector: Injector = getCoreInjector()): Injector {
  const platform = injectorFactory({
    id, 
    scope: "platform", 
    module, 
    parentInjector, 
    providers: [{ provide: PLATFORM_ID, useValue: id }]
  });
  parentInjector.addProvider({
    provide: PLATFORMS,
    useValue: {
      id,
      module,
      injector: platform,
    },
  });
  return platform;
}
