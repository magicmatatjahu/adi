import { ScopeType } from ".";

export interface ComponentOptions<S> {
  // imports?: ModuleMetadata['imports'];
  // providers?: ModuleMetadata['providers'];
  scope?: ScopeType<S>;
  annotations?: Record<string | symbol, any>;
}
