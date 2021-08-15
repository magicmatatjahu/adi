import { PlainSansProvider, ScopeType, Type } from ".";

export type ProvideInType = string | symbol | Type | 'any';

export type InjectableOptions<S> = {
  // imports?: ModuleMetadata['imports'];
  // providers?: ModuleMetadata['providers'];
  provideIn?: ProvideInType | ProvideInType[];
  scope?: ScopeType<S>;
  annotations?: Record<string | symbol, any>;
} & Partial<PlainSansProvider>;

export type InjectionTokenOptions<S> = {
  provideIn?: ProvideInType | ProvideInType[];
  scope?: ScopeType<S>;
  annotations?: Record<string | symbol, any>;
} & Partial<PlainSansProvider>;
