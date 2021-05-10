import { Context } from "../injector";
import { InstanceRecord, WrapperDef } from ".";
import { Token } from "../types";
import { Scope } from "../scope";

export interface InjectionOptions<T = any> {
  token: Token<T>;
  ctx?: Context;
  scope?: Scope;
  labels?: Record<string | symbol, any>;
  useWrapper?: WrapperDef,
}

export interface InjectionMetadata {
  target?: Object;
  propertyKey?: string | symbol;
  index?: number;
  factory?: Function;
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
  shared?: any;
}
