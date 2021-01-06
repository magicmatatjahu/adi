import { Injectable, OnInit, Scope } from "../../../../../../src/di";

import { AuthService } from "../auth/auth.service";
import { DBService } from "../db/db.service";

export interface Admin {
  name: string,
  surname: string,
  isAuthorized: boolean,
} 

@Injectable({
  scope: Scope.SINGLETON,
})
export class AdminsService implements OnInit {
  constructor(
    private readonly dbService: DBService,
    private readonly authService: AuthService,
  ) {}

  onInit() {
    const admins: Admin[] = [
      {
        name: "foo",
        surname: "bar",
        isAuthorized: true,
      },
      {
        name: "Albert",
        surname: "Einstein",
        isAuthorized: true,
      }
    ];

    admins.forEach(admin => this.addAdmin(admin));
  }

  getAdmins(): Admin[] {
    return this.dbService.getItems<Admin>("admins");
  }

  getAdmin(id: number): Admin {
    return this.dbService.getItem<Admin>(id, "admins");
  }

  addAdmin(admin: Admin): void {
    return this.dbService.addItem(admin, "admins");
  }

  removeAdmin(id: number): void {
    return this.dbService.removeItem(id, "admins");
  }

  isAuthorized(id: number): boolean {
    return this.authService.isAuthorized(this.getAdmin(id));
  }
}
