import { ScopeOptions } from "./scope-options.interface"
import { Type } from "./type.interface"
import { BindingLabels } from "../types"

export interface InjectableOptions extends ScopeOptions {
  labels?: BindingLabels,
  providedIn?: string | symbol | Type;
  export?: boolean;
}
