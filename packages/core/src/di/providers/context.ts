import { InjectionSessionService } from "../services";
import { Scope } from "../scopes";
import { InjectionToken } from "../tokens";

export const CONTEXT = new InjectionToken<never>({
  useFactory: (session: InjectionSessionService) => {
    const s = session.currentSession();
    return s && s.ctxRecord.ctx;
  },
  inject: [InjectionSessionService],
  scope: Scope.PROTOTYPE,
  providedIn: "any",
}, "CONTEXT");
