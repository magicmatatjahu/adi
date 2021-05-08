import { Provider, Type } from ".";

export interface InjectorOptions {
  scope?: string | symbol | Type;
  setupProviders?: Provider[];
}
