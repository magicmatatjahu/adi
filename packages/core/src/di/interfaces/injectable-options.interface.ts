import { Token } from "di/types"
import { ScopeOptions } from "./scope-options.interface"
import { Type } from "./type.interface"

export interface InjectableOptions extends ScopeOptions {
  def?: Token;
  providedIn?: string | symbol | Type;
  export?: boolean;
}
