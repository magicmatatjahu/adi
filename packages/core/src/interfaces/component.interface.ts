import { ScopeType } from ".";
import { Wrapper } from "../utils";
export interface ComponentOptions<S> {
  // imports?: ModuleMetadata['imports'];
  // providers?: ModuleMetadata['providers'];
  scope?: ScopeType<S>;
  annotations?: Record<string | symbol, any>;
}
