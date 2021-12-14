import { PlainSansProvider, PlainInjections, ScopeType, Type } from ".";
import { Annotations } from "./common.interface";

export type ProvideInType = string | symbol | Type | 'any';

export type InjectableOptions<S> = {
  provideIn?: ProvideInType | ProvideInType[];
  scope?: ScopeType<S>;
  annotations?: Annotations;
} & Partial<PlainSansProvider>;

export type InjectionTokenOptions<S> = {
  provideIn?: ProvideInType | ProvideInType[];
  scope?: ScopeType<S>;
  annotations?: Annotations;
} & Partial<PlainSansProvider>;

export interface InjectableMetadata<S = any> {
  options?: InjectableOptions<S>;
  injections?: Omit<PlainInjections, 'dynamic'>;
}
