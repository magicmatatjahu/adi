import { ProviderDef, InjectionSession } from "../interfaces";
import { Scope } from "../scopes";

export class InjectionSessionService {
  constructor(
    public readonly session: InjectionSession,
    private readonly sync: boolean,
  ) {}

  // TODO: Change it
  _session() {
    return this.session.parent;
  }

  currentSession(): InjectionSession | undefined {
    const s = this.session.parent;
    return s && s.parent;
  }

  parentSession(): InjectionSession | undefined {
    const s = this.currentSession();
    return s && s.parent;
  }

  isSyncInjection(): boolean {
    return this.sync === true;
  }

  static _$prov: ProviderDef = {
    token: InjectionSessionService,
    factory: (_: any, session: InjectionSession, sync?: boolean) => new InjectionSessionService(session, sync),
    scope: Scope.PROTOTYPE,
    providedIn: "any",
  }
}
