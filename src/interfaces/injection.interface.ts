import { Context } from "../injector";
import { InstanceRecord, ScopeShape, PlainInjections } from ".";
import { Token } from "../types";
import { Wrapper } from "../utils/wrappers";

export interface InjectionOptions<T = any> {
  token: Token<T>;
  ctx?: Context;
  scope?: ScopeShape;
  labels?: Record<string | symbol, any>;
  // TOOD: Think about this... Maybe it's unnecessary
  injections?: Array<Token | Wrapper> | PlainInjections;
}

export interface InjectionMetadata {
  target: Object;
  propertyKey?: string | symbol;
  index?: number;
}

export interface InjectionArgument<T = any> {
  token: Token<T>;
  wrapper: Wrapper,
  metadata: InjectionMetadata;
}

export interface InjectionSession<T = any> {
  instance: InstanceRecord<T>;
  options: InjectionOptions;
  meta: InjectionMetadata;
  parent?: InjectionSession;
}
