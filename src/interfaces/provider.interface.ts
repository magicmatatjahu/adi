import { Scope } from "../scope";
import { Token } from "../types";
import { ConstraintDef, WrapperDef, Type } from ".";

export type Provider<T = any> =
  | TypeProvider<T>
  | CustomProvider<T>;

export type CustomProvider<T = any> =
  | ClassProvider<T>
  | FactoryProvider<T>
  | ExistingProvider<T>
  | ValueProvider<T>
  | WrapperProvider<T>;

export interface TypeProvider<T = any> extends Type<T> {}

export interface ClassProvider<T = any> {
  provide: Token<T>;
  useClass: Type<T>;
  scope?: Scope;
  when?: ConstraintDef;
}

export interface FactoryProvider<T = any> {
  provide: Token<T>;
  useFactory: (...args: any[]) => T | Promise<T>;
  inject?: Array<Token>; // Array<Token | Array<ParameterDecorator>>;
  scope?: Scope;
  when?: ConstraintDef;
}

export interface ExistingProvider<T = any> {
  provide: Token<T>;
  useExisting: Token;
  when?: ConstraintDef;
}

export interface ValueProvider<T = any> {
  provide: Token<T>;
  useValue: T;
  when?: ConstraintDef;
}

export interface WrapperProvider<T = any> {
  provide: Token<T>;
  useWrapper: WrapperDef;
  when?: ConstraintDef;
}

export interface ForwardRef<T = any> {
  ref: () => T;
  _$ref: Function;
}
