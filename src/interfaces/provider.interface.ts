import { Scope } from "../scope";
import { Token } from "../types";
import { ConstraintDef, Type } from ".";
import { Wrapper } from "../utils/wrappers";

export type Provider<T = any> =
  | TypeProvider<T>
  | PlainProvider<T>;

export type PlainProvider<T = any> =
  | ClassProvider<T>
  | FactoryProvider<T>
  | ExistingProvider<T>
  | ValueProvider<T>
  | WrapperProvider<T>;

export type PlainSansProvider<T = any> =
  | Omit<ClassProvider<T>, 'provide' | 'when' | 'annotations'>
  | Omit<FactoryProvider<T>, 'provide' | 'when' | 'annotations'>
  | Omit<ValueProvider<T>, 'provide' | 'when' | 'annotations'>
  | Omit<ExistingProvider<T>, 'provide' | 'when' | 'annotations'>
  | Omit<WrapperProvider<T>, 'provide' | 'when' | 'annotations'>

export interface TypeProvider<T = any> extends Type<T> {}

export interface ClassProvider<T = any> {
  provide: Token<T>;
  useClass: Type<T>;
  scope?: Scope;
  useWrapper?: Wrapper;
  when?: ConstraintDef;
  annotations?: Record<string | symbol, any>;
}

export interface FactoryProvider<T = any> {
  provide: Token<T>;
  useFactory: (...args: any[]) => T | Promise<T>;
  inject?: Array<Token | Wrapper>;
  scope?: Scope;
  useWrapper?: Wrapper;
  when?: ConstraintDef;
  annotations?: Record<string | symbol, any>;
}

// TODO: Check how `useWrapper` works for ExistingProvider if ADI replaces record to the record of aliases provider
export interface ExistingProvider<T = any> {
  provide: Token<T>;
  useExisting: Token;
  useWrapper?: Wrapper;
  when?: ConstraintDef;
  annotations?: Record<string | symbol, any>;
}

export interface ValueProvider<T = any> {
  provide: Token<T>;
  useValue: T;
  useWrapper?: Wrapper;
  when?: ConstraintDef;
  annotations?: Record<string | symbol, any>;
}

export interface WrapperProvider<T = any> {
  provide: Token<T>;
  useWrapper: Wrapper;
  when?: ConstraintDef;
  // TODO: useWrapper should have also annotations? Think about it
  annotations?: Record<string | symbol, any>;
}

export interface ForwardRef<T = any> {
  ref: () => T;
  _$ref: Function;
}
