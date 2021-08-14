import { Scope } from "../scope";

export interface ScopeShape<T = any> { 
  which: Scope<T>, 
  options: T
};

export type ScopeType<T = any> = Scope<T> | { which: Scope<T>, options: T };