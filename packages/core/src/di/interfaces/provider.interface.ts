import { Type } from "./type.interface";
import { ScopeOptions } from "./scope-options.interface";
import { Context } from "../tokens";
import { Token } from "../types";

export type Provider<T = any> =
  | TypeProvider<T>
  | ClassProvider<T>
  | ConstructorProvider<T>
  | StaticClassProvider<T>
  | FactoryProvider<T>
  | FactoryConfigProvider
  | ExistingProvider<T>
  | ExistingMultiProvider<T>
  | ValueProvider<T>;

export type ProviderBody<T = any> = 
  | ClassProviderBody<T>
  | ConstructorProviderBody
  | StaticClassProviderBody<T>
  | FactoryProviderBody<T>
  | ExistingProviderBody
  | ExistingMultiProviderBody
  | ValueProviderBody<T>;

export interface TypeProvider<T = any> extends Type<T> {}

export interface ClassProvider<T = any> extends ClassProviderBody<T> {
  provide: Token<T>;
}

export interface ClassProviderBody<T = any> extends ScopeOptions {
  useClass: Type<T>;
}

export interface ConstructorProvider<T = any> extends ConstructorProviderBody {
  provide: Type<T>;
}

export interface ConstructorProviderBody extends ScopeOptions {
  inject?: Array<Token | Array<ParameterDecorator>>;
}

export interface StaticClassProvider<T = any> extends StaticClassProviderBody<T> {
  provide: Token<T>;
}

export interface StaticClassProviderBody<T = any> extends ScopeOptions {
  useClass: Type<T>;
  inject?: Array<Token | Array<ParameterDecorator>>;
}

export interface FactoryProvider<T = any> extends FactoryProviderBody<T> {
  provide: Token<T>;
}

export interface FactoryProviderBody<T = any> extends ScopeOptions {
  useFactory: (...args: any[]) => T | Promise<T>;
  inject?: Array<Token | Array<ParameterDecorator>>;
}

export interface FactoryConfigProvider {
  useFactory: Type;
}

export interface ExistingProvider<T = any> extends ExistingProviderBody {
  provide: Token<T>;
}

export interface ExistingProviderBody {
  useExisting: Token;
  ctx?: Context;
  default?: any;
}

export interface ExistingMultiProvider<T = any> extends ExistingMultiProviderBody {
  provide: Token<T>;
}

export interface ExistingMultiProviderBody {
  useExisting: Array<Token | {
    token: Token,
    ctx?: Context;
    default?: any;
  }>;
}

export interface ValueProvider<T = any> extends ValueProviderBody<T> {
  provide: Token<T>;
}

export interface ValueProviderBody<T = any> {
  useValue: T;
  ctx?: Context;
}
