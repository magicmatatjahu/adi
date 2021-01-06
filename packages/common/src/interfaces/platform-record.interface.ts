import { Injector, Type, ModuleMeta, Provider } from "@adi/core";

export interface PlatformRecord {
  id: string;
  module: Type<any> | ModuleMeta | Array<Provider>;
  injector: Injector;
}
