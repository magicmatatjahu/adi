import { PlainSansProvider, PlainInjections, ScopeType, ModuleMetadata, Type } from ".";

export type ProvideInType = string | symbol | Type | 'any';

export type InjectableOptions<S> = {
  provideIn?: ProvideInType | ProvideInType[];
  scope?: ScopeType<S>;
  annotations?: Record<string | symbol, any>;
} & Partial<PlainSansProvider>;

export type InjectionTokenOptions<S> = {
  provideIn?: ProvideInType | ProvideInType[];
  scope?: ScopeType<S>;
  annotations?: Record<string | symbol, any>;
} & Partial<PlainSansProvider>;

export interface StaticInjectable<S = any> {
  options?: InjectableOptions<S>;
  injections?: Omit<PlainInjections, 'dynamic'>;
}
