import { Context } from "../injector";
import { InstanceRecord, WrapperDef } from ".";
import { Token } from "../types";
import { Scope } from "../scope";

export interface InjectionOptions {
  ctx?: Context;
  scope?: Scope;
  attrs?: Record<string | symbol, any>;
}

export interface InjectionMetadata<T = any> {
  target?: Object;
  propertyKey?: string | symbol;
  index?: number;
  instance?: T,
}

export interface InjectionArgument<T = any> {
  token: Token<T>;
  wrappers: Array<WrapperDef>,
  options: InjectionOptions;
  meta: InjectionMetadata;
}

export interface InjectionSession<T = any> {
  instance: InstanceRecord<T>;
  options: InjectionOptions;
  meta: InjectionMetadata;
  parent?: InjectionSession;
}
