import { Scope } from "../scopes";
import { InjectionFlags } from "../enums";
import { Context } from "../tokens";
import { Token } from "../types";

export interface InjectionOptions {
  flags?: InjectionFlags;
  def?: Token;
  ctx?: Context;
  scope?: Scope;
  scopeParams?: any;
  default?: any;
  target?: Object;
  propertyKey?: string | symbol;
  index?: number;
  instance?: any,
}
