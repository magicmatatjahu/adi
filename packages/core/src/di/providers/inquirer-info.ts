import { ProviderDef, InquirerDef } from "../interfaces";
import { Scope } from "../scopes";

export class InquirerInfo {
  constructor(
    public readonly info: InquirerDef,
  ) {}

  getInquirer(): InquirerDef | undefined {
    const inq = this.info.inquirer;
    return inq && inq.inquirer;
  }

  static _$prov: ProviderDef = {
    token: InquirerInfo,
    factory: (_: any, inquirer: InquirerDef, sync?: boolean) => new InquirerInfo(inquirer),
    scope: Scope.PROTOTYPE,
    providedIn: "any",
  }
}
