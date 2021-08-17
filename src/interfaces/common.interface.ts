import { Scope } from "../scope";

export interface ScopeShape<T = any> { 
  kind: Scope<T>, 
  options: T
};

export type ScopeType<T = any> = Scope<T> | ScopeShape<T>;