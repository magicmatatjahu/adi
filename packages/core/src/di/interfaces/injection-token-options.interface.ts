import { ProviderBody } from "./provider.interface";
import { Type } from "./type.interface"

export type InjectionTokenOptions = {
  multi?: boolean;
  providedIn?: string | symbol | Type;
  export?: boolean;
} & ProviderBody;
