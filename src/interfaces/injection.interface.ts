import { Context } from "../injector";
import { InstanceRecord, ScopeShape } from ".";
import { Token } from "../types";
import { Wrapper } from "../utils/wrappers";

export interface InjectionOptions<T = any> {
  token: Token<T>;
  ctx?: Context;
  scope?: ScopeShape;
  labels?: Record<string | symbol, any>;
  wrapper?: Wrapper,
}

export interface InjectionMetadata {
  target?: Object;
  propertyKey?: string | symbol;
  index?: number;
}

export interface InjectionArgument<T = any> {
  // argument and options have token, it (token) should be only in one place
  token: Token<T>;
  options: InjectionOptions;
  metadata: InjectionMetadata;
}

export interface InjectionSession<T = any> {
  instance: InstanceRecord<T>;
  options: InjectionOptions;
  meta: InjectionMetadata;
  parent?: InjectionSession;
}
