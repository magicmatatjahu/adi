import { Injector, createInjector, INJECTOR_SCOPE, INJECTOR_ID } from "@adi/core";
import { InjectorFactoryOptions } from "../interfaces";

export function injectorFactory(options: InjectorFactoryOptions): Injector {
  const providers = options.providers || [];
  return createInjector(options.module, options.parentInjector, [
    ...providers,
    { provide: INJECTOR_SCOPE, useValue: options.scope },
    { provide: INJECTOR_ID, useValue: options.id },
  ]);
}
