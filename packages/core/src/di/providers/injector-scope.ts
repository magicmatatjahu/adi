import { Type } from "../interfaces";
import { InjectionToken } from "../tokens";

type ScopeType = string | symbol | Type;

export const INJECTOR_SCOPE = new InjectionToken<ScopeType | Array<ScopeType>>({
  providedIn: "any",
  useValue: "any",
}, "INJECTOR_SCOPE");
