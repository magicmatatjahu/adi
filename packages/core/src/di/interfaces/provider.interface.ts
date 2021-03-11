import { Injector } from "../injector";
import { FactoryDef, ConstraintFunction } from "./definitions.interface";
import { InjectionRecord } from "./records.interface";
import { Type } from "./type.interface";
import { ScopeOptions } from "./scope-options.interface";
import { Token } from "../types";

export type Provider<T = any> =
  | TypeProvider<T>
  | ClassProvider<T>
  | ConstructorProvider<T>
  | StaticClassProvider<T>
  | FactoryProvider<T>
  | ExistingProvider<T>
  | _CustomProvider<T>
  | ValueProvider<T>;

export type CustomProvider<T = any> =
  | ClassProvider<T>
  | ConstructorProvider<T>
  | StaticClassProvider<T>
  | FactoryProvider<T>
  | ExistingProvider<T>
  | _CustomProvider<T>
  | ValueProvider<T>;

export type ProviderBody<T = any> = 
  | ClassProviderBody<T>
  | ConstructorProviderBody
  | StaticClassProviderBody<T>
  | FactoryProviderBody<T>
  | ExistingProviderBody
  | _CustomProviderBody<T>
  | ValueProviderBody<T>;

export interface TypeProvider<T = any> extends Type<T> {}

export interface ClassProvider<T = any> extends ClassProviderBody<T> {
  provide: Token<T>;
}

export interface ClassProviderBody<T = any> extends ScopeOptions {
  when?: ConstraintFunction;
  useClass: Type<T>;
}

export interface ConstructorProvider<T = any> extends ConstructorProviderBody {
  provide: Type<T>;
}

export interface ConstructorProviderBody extends ScopeOptions {
  when?: ConstraintFunction;
  inject?: Array<Token | Array<ParameterDecorator>>;
}

export interface StaticClassProvider<T = any> extends StaticClassProviderBody<T> {
  provide: Token<T>;
}

export interface StaticClassProviderBody<T = any> extends ScopeOptions {
  when?: ConstraintFunction;
  useClass: Type<T>;
  inject?: Array<Token | Array<ParameterDecorator>>;
}

export interface FactoryProvider<T = any> extends FactoryProviderBody<T> {
  provide: Token<T>;
}

export interface FactoryProviderBody<T = any> extends ScopeOptions {
  when?: ConstraintFunction;
  useFactory: (...args: any[]) => T | Promise<T>;
  inject?: Array<Token | Array<ParameterDecorator>>;
}

export interface ExistingProvider<T = any> extends ExistingProviderBody {
  provide: Token<T>;
}

export interface ExistingProviderBody {
  when?: ConstraintFunction;
  useExisting: Token;
}

export interface ValueProvider<T = any> extends ValueProviderBody<T> {
  provide: Token<T>;
}

export interface ValueProviderBody<T = any> {
  when?: ConstraintFunction;
  useValue: T;
}

export interface _CustomProvider<T = any> extends _CustomProviderBody<T> {
  provide: Token<T>;
}

export interface _CustomProviderBody<T = any> {
  when?: ConstraintFunction;
  useCustom: (record: InjectionRecord) => FactoryDef<T>;
}
