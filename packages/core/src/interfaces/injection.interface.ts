import { Context } from "../injector";
import { InjectionItem, ScopeShape, PlainInjections } from ".";
import { Token } from "../types";
import { Wrapper } from "../utils/wrappers";

export interface InjectionOptions<T = any> {
  token: Token<T>;
  ctx?: Context;
  scope?: ScopeShape;
  labels?: Record<string | symbol, any>;
  injections?: Array<InjectionItem> | PlainInjections;
}

export interface InjectionMetadata {
  target: Object;
  propertyKey?: string | symbol;
  index?: number;
}

export interface InjectionArgument<T = any> {
  token: Token<T>;
  wrapper: Wrapper | Array<Wrapper>,
  metadata: InjectionMetadata;
}
