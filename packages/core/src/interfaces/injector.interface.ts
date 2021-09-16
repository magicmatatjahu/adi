import { ModuleMetadata, ModuleID, Provider, Type } from ".";

export type InjectorScopeType = string | symbol | Type | 'any';

export interface InjectorOptions {
  scope?: InjectorScopeType | InjectorScopeType[];
  id?: ModuleID;
  setupProviders?: Provider[];
  disableExporting?: boolean;
}

export interface InjectableInjector {
  imports?: ModuleMetadata['imports'];
  providers?: ModuleMetadata['providers'];
}
