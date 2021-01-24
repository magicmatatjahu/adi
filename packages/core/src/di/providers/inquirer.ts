import { resolver } from "../injector/resolver";
import { Scope } from "../scopes";
import { InjectionToken } from "../tokens";
import { InjectionSession } from "./injection-session";

export const INQUIRER = new InjectionToken<never>({
  useFactory: (session: InjectionSession) => {
    let s = session.getCurrentSession();
    return s && s.inquirer && resolver.handleCircularDeps(s.inquirer.ctxRecord);
  },
  inject: [InjectionSession],
  scope: Scope.PROTOTYPE,
  providedIn: "any",
}, "INQUIRER");
