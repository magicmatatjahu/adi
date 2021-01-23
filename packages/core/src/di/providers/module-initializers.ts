import { Scope } from "../scopes";
import { InjectionToken } from "../tokens";

export const MODULE_INITIALIZERS = new InjectionToken<(...args: any[]) => Promise<any> | any>({
  multi: true,
  useValue: [],
  scope: Scope.SINGLETON,
  providedIn: "any",
});
