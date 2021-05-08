import { CustomSansProvider, Type } from ".";
import { Scope } from "../scope";

export type ProvideInType = string | symbol | Type | 'any';

export interface InjectableOptions {
  providedIn?: ProvideInType | ProvideInType[];
  scope?: Scope;
}

export type InjectionTokenOptions = {
  providedIn?: ProvideInType | ProvideInType[];
  scope?: Scope;
} & CustomSansProvider;
