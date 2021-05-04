import { Context } from "../injector";
import { InstanceRecord, WrapperDef } from ".";
import { Token } from "../types";
import { Scope } from "../scope";

export interface InjectionOptions<T = any> {
  token: Token<T>;
  ctx?: Context;
  scope?: Scope;
  attrs?: Record<string | symbol, any>;
  wrapper: WrapperDef,
}

export interface InjectionMetadata<T = any> {
  target?: Object;
  propertyKey?: string | symbol;
  index?: number;
  instance?: T,
}

export interface InjectionArgument<T = any> {
  // argument and options have token, it (token) should be only in one place
  token: Token<T>;
  options: InjectionOptions;
  meta: InjectionMetadata;
}

export interface InjectionSession<T = any> {
  instance: InstanceRecord<T>;
  options: InjectionOptions;
  meta: InjectionMetadata;
  parent?: InjectionSession;
}
