import { Injectable, Scope } from "../../../../../../src/di";

@Injectable({
  providedIn: "any",
  scope: Scope.SINGLETON,
})
export class AuthService {
  isAuthorized(item: any): boolean {
    return item && item.isAuthorized;
  }
}
