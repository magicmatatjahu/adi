import { ModuleMetadata } from ".";
import { Scope } from "../scope";

export interface ComponentOptions {
  // imports?: ModuleMetadata['imports'];
  // providers?: ModuleMetadata['providers'];
  scope?: Scope;
  // labels?: Record<string | symbol, any>;
}
