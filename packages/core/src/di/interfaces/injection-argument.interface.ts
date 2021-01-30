import { InjectionOptions } from "./injection-options.interface";
import { Token } from "../types";

export interface InjectionArgument<T = any> {
  token: Token<T>;
  options: InjectionOptions;
}

export interface MethodArgument {
  deps: Array<InjectionArgument>;
  target?: Object;
  propertyKey?: string | symbol;
  instance?: any,
}
