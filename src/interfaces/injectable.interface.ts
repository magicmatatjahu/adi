import { Type } from ".";
import { Scope } from "../scope";

export interface InjectableOptions {
  providedIn?: string | symbol | Type;
  scope?: Scope;
}
