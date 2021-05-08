import { Provider, Type } from ".";

export interface InjectorOptions {
  scope?: InjectorScopeType | InjectorScopeType[];
  setupProviders?: Provider[];
}

export type InjectorScopeType = string | symbol | Type | 'any';
