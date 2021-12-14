import { Scope } from "../scope";

export interface ScopeShape<T = any> { 
  kind: Scope<T>, 
  options: T
};

export type ScopeType<T = any> = Scope<T> | ScopeShape<T>;

export interface ForwardRef<T = any> {
  ref: () => T;
  _$ref: Function;
};

export interface DestroyableType<T> {
  value: T;
  destroy(): Promise<void>;
};

export type Annotations = Record<string | symbol, any>;
