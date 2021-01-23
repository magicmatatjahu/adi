import { Scope } from "../scopes";
import { InjectionToken } from "../tokens";
import { InquirerInfo } from "./inquirer-info";

export const CONTEXT = new InjectionToken<never>({
  useFactory: (inquirer: InquirerInfo) => {
    const inq = inquirer.getInquirer();
    return inq && inq.ctxRecord.ctx;
  },
  inject: [InquirerInfo],
  scope: Scope.PROTOTYPE,
  providedIn: "any",
});
