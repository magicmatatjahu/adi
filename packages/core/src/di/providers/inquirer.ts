import { resolver } from "../injector/resolver";
import { InjectionSessionService } from "../services";
import { Scope } from "../scopes";
import { InjectionToken } from "../tokens";

export const INQUIRER = new InjectionToken<never>({
  useFactory: (session: InjectionSessionService) => {
    const s = session.parentSession();
    return s && resolver.handleCircularDeps(s.ctxRecord);
  },
  inject: [InjectionSessionService],
  scope: Scope.PROTOTYPE,
  providedIn: "any",
}, "INQUIRER");
