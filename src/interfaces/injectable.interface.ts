import { PlainSansProvider, ScopeType, Type } from ".";
import { InjectionArguments } from "./definition.interface";

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

export interface StaticInjectable<S> {
  options?: InjectableOptions<S>,
  injections?: InjectionArguments 
}
