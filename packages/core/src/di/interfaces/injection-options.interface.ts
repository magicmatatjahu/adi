import { Scope } from "../scopes";
import { InjectionFlags } from "../enums";
import { Context } from "../tokens";

export interface InjectionOptions {
  flags?: InjectionFlags;
  ctx?: Context;
  scope?: Scope;
  scopeParams?: any;
  attrs?: Record<string | symbol | number, any>;
  target?: Object;
  propertyKey?: string | symbol;
  index?: number;
  instance?: any,
}
