import { CustomSansProvider, Type } from ".";
import { Scope } from "../scope";

export type ProvideInType = string | symbol | Type | 'any';

export type InjectableOptions = {
  provideIn?: ProvideInType | ProvideInType[];
  scope?: Scope;
} & Partial<CustomSansProvider>;

export type InjectionTokenOptions = {
  provideIn?: ProvideInType | ProvideInType[];
  scope?: Scope;
} & Partial<CustomSansProvider>;
