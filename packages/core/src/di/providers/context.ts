import { Scope } from "../scopes";
import { InjectionToken } from "../tokens";
import { InjectionSession } from "./injection-session";

export const CONTEXT = new InjectionToken<never>({
  useFactory: (session: InjectionSession) => {
    const s = session.getCurrentSession();
    return s && s.ctxRecord.ctx;
  },
  inject: [InjectionSession],
  scope: Scope.PROTOTYPE,
  providedIn: "any",
}, "CONTEXT");
