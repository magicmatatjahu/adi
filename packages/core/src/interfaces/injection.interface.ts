import { Context } from "../injector";
import { Annotations, ScopeShape } from "./common.interface";
import { Token } from "../types";
import { Wrapper } from "../utils/wrappers";
import { InjectionKind } from "../enums";
import { ModuleMetadata } from ".";

export interface InjectionOptions<T = any> {
  token: Token<T>;
  ctx?: Context;
  scope?: ScopeShape;
  annotations?: Annotations;
  injections?: Array<InjectionItem> | PlainInjections;
}

export interface InjectionMetadata {
  target: Object;
  propertyKey?: string | symbol;
  index?: number;
  annotations?: Annotations;
  kind: InjectionKind;
}

export interface InjectionArgument<T = any> {
  token: Token<T>;
  wrapper: Wrapper | Array<Wrapper>,
  metadata: InjectionMetadata;
}

export interface InjectionArguments {
  parameters: Array<InjectionArgument>;
  properties: Record<string | symbol, InjectionArgument>;
  methods: Record<string, InjectionArgument[]>;
}

export type InjectionItem<T = any> = 
  Token<T> | 
  Wrapper | 
  Array<Wrapper> | 
  PlainInjectionItem<T>;

export interface PlainInjectionItem<T = any> { 
  token: Token<T>, 
  wrapper?: Wrapper | Array<Wrapper>, 
  annotations?: Annotations, 
};

export interface PlainInjections {
  parameters?: Array<InjectionItem>;
  properties?: Record<string | symbol, InjectionItem>;
  methods?: Record<string, Array<InjectionItem>>;
  override?: (injectionArg: InjectionArgument) => InjectionItem | undefined;
}

export interface StandaloneInjections {
  inject?: Array<InjectionItem>;
  imports?: ModuleMetadata['imports'];
  providers?: ModuleMetadata['providers'];
}