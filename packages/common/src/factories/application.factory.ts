import { Injector, ModuleMeta, Type, Provider } from "@adi/core";
import { getCoreInjector } from "@adi/core/dist/src/di/injector";

import { injectorFactory } from "./injectorFactory.factory";

import { APPLICATION_ID, APPLICATIONS } from "../constants";

export function createApplication(id: string, module: Type<any> | ModuleMeta | Array<Provider> = [], platform: Injector = getCoreInjector()): Injector {
  const application = injectorFactory({ 
    id,
    scope: "app",
    module,
    parentInjector: platform,
    providers: [{ provide: APPLICATION_ID, useValue: id }]
  });
  platform.addProvider({
    provide: APPLICATIONS,
    useValue: {
      id,
      module,
      injector: application,
    },
  });
  return application;
}
