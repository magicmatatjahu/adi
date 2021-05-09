import { Scope } from "../scope";

export interface ComponentOptions {
  scope?: Scope;
  labels?: Record<string | symbol, any>;
}
