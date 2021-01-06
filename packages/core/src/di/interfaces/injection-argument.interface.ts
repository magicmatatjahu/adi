import { Extensions } from "./extensions.interface";
import { InjectionOptions } from "./injection-options.interface";
import { Token } from "../types";

export interface InjectionArgument<T = any> {
  token: Token<T>;
  options: InjectionOptions;
  extensions?: Extensions;
}

export interface MethodArgument {
  deps: Array<InjectionArgument>;
  extensions?: Extensions;
  target?: Object;
  propertyKey?: string | symbol;
  instance?: any,
}
