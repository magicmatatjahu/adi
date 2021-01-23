import { resolver } from "../injector/resolver";
import { Scope } from "../scopes";
import { InjectionToken } from "../tokens";
import { InquirerInfo } from "./inquirer-info";

export const INQUIRER = new InjectionToken<never>({
  useFactory: (inquirer: InquirerInfo) => {
    return undefined;
    let inq = inquirer.getInquirer();
    inq = inq && inq.inquirer;
    // sometimes (in Circular Deps) it creates second instance of Inquirered type
    return inq && resolver.handleCircularDeps(inq.ctxRecord);
  },
  inject: [InquirerInfo],
  scope: Scope.PROTOTYPE,
  providedIn: "any",
});
