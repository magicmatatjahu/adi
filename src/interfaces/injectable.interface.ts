import { Type } from ".";
import { Scope } from "../scope";

export type ProvideInType = string | symbol | Type;

export interface InjectableOptions {
  providedIn?: ProvideInType | ProvideInType[];
  scope?: Scope;
}

export interface InjectionTokenOptions {
  providedIn?: ProvideInType | ProvideInType[];
  scope?: Scope;
} 