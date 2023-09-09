import { InjectorScope } from "./injector";
import { OverwriteProvider } from "./provider";

export type InjectionTokenProvide<T> = OverwriteProvider<T> & {
  provideIn?: InjectorScope | Array<InjectorScope>;
} 

export interface InjectionTokenOptions {
  name?: string
}
