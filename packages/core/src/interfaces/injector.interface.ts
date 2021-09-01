import { ModuleID, Provider, Type } from ".";

export interface InjectorOptions {
  scope?: InjectorScopeType | InjectorScopeType[];
  id?: ModuleID;
  setupProviders?: Provider[];
}

export type InjectorScopeType = string | symbol | Type | 'any';
