import { ModuleID, Provider, Type } from ".";

export type InjectorScopeType = string | symbol | Type | 'any';

export interface InjectorOptions {
  scope?: InjectorScopeType | InjectorScopeType[];
  id?: ModuleID;
  setupProviders?: Provider[];
}
