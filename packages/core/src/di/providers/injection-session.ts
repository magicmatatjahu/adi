import { ProviderDef, InquirerDef } from "../interfaces";
import { Scope } from "../scopes";

export class InjectionSession {
  constructor(
    public readonly session: InquirerDef,
    private readonly sync: boolean,
  ) {}

  getCurrentSession(): InquirerDef | undefined {
    const inq = this.session.inquirer;
    return inq && inq.inquirer;
  }

  isSyncInjection(): boolean {
    return this.sync === true;
  }

  static _$prov: ProviderDef = {
    token: InjectionSession,
    factory: (_: any, session: InquirerDef, sync?: boolean) => new InjectionSession(session, sync),
    scope: Scope.PROTOTYPE,
    providedIn: "any",
  }
}
