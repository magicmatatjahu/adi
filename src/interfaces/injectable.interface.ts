import { ModuleMetadata, PlainSansProvider, Type } from ".";
import { Scope } from "../scope";

export type ProvideInType = string | symbol | Type | 'any';

export type InjectableOptions = {
  // imports?: ModuleMetadata['imports'];
  // providers?: ModuleMetadata['providers'];
  provideIn?: ProvideInType | ProvideInType[];
  scope?: Scope;
  annotations?: Record<string | symbol, any>;
  // labels?: Record<string | symbol, any>;
} & Partial<PlainSansProvider>;

export type InjectionTokenOptions = {
  provideIn?: ProvideInType | ProvideInType[];
  scope?: Scope;
  annotations?: Record<string | symbol, any>;
  // labels?: Record<string | symbol, any>;
} & Partial<PlainSansProvider>;
