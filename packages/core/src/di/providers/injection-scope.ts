import { Type } from "../interfaces";
import { InjectionToken } from "../tokens";

export const INJECTOR_SCOPE = new InjectionToken<string | symbol | Type>({
  providedIn: "any",
  useValue: "any",
});
