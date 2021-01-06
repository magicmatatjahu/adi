import { Injector, Type, ModuleMeta, Provider } from "@adi/core";

export interface InjectorFactoryOptions {
  id: string,
  module: Type<any> | ModuleMeta | Array<Provider>,
  scope: string,
  parentInjector?: Injector,
  providers?: Array<Provider>,
}
