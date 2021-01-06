import { Injector, Type, ModuleMeta, Provider } from "@adi/core";

export interface ApplicationRecord {
  id: string;
  module: Type<any> | ModuleMeta | Array<Provider>;
  injector: Injector;
}
