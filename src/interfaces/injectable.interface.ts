import { PlainSansProvider, ScopeType, Type } from ".";
import { Scope } from "../scope";

export type ProvideInType = string | symbol | Type | 'any';

export type InjectableOptions<S> = {
  // imports?: ModuleMetadata['imports'];
  // providers?: ModuleMetadata['providers'];
  provideIn?: ProvideInType | ProvideInType[];
  scope?: ScopeType<S>;
  annotations?: Record<string | symbol, any>;
} & Partial<PlainSansProvider>;

export type InjectionTokenOptions = {
  provideIn?: ProvideInType | ProvideInType[];
  scope?: Scope;
  annotations?: Record<string | symbol, any>;
} & Partial<PlainSansProvider>;
