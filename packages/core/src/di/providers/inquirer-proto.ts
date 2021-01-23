import { resolver } from "../injector/resolver";
import { Scope } from "../scopes";
import { InjectionToken } from "../tokens";
import { InquirerInfo } from "./inquirer-info";

export const INQUIRER_PROTO = new InjectionToken<never>({
  useFactory: (inquirer: InquirerInfo) => {
    const inq = inquirer.getInquirer();
    return undefined;
    return inq && inq.inquirer && inq.inquirer.ctxRecord.def.prototype;
  },
  inject: [InquirerInfo],
  scope: Scope.PROTOTYPE,
  providedIn: "any",
});
