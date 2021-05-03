import { Context } from "../injector";
import { InstanceRecord } from ".";
import { Token } from "../types";
import { Scope } from "../scope";

export interface InjectionOptions {
  // flags?: InjectionFlags;
  ctx?: Context;
  scope?: Scope;
  // scopeParams?: any;
  // attrs?: Record<string | symbol | number, any>;
  target?: Object;
  propertyKey?: string | symbol;
  index?: number;
  instance?: any,
}

export interface InjectionArgument<T = any> {
  token: Token<T>;
  options: InjectionOptions;
}

export interface InjectionSession<T = any> {
  options: InjectionOptions;
  instance: InstanceRecord<T>;
  parent?: InjectionSession;
}
