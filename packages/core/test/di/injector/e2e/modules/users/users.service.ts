import { Injectable, OnInit, Scope } from "../../../../../../src/di";

import { AuthService } from "../auth/auth.service";
import { DBService } from "../db/db.service";

export interface User {
  name: string,
  surname: string,
  isAuthorized: boolean,
} 

@Injectable({
  scope: Scope.SINGLETON,
})
export class UsersService implements OnInit {
  constructor(
    private readonly dbService: DBService,
    private readonly authService: AuthService,
  ) {}

  onInit() {
    const users: User[] = [
      {
        name: "foo",
        surname: "bar",
        isAuthorized: false,
      },
      {
        name: "Albert",
        surname: "Einstein",
        isAuthorized: false,
      }
    ];

    users.forEach(admin => this.addUser(admin));
  }

  getUser(id: number): User {
    return this.dbService.getItem<User>(id, "users");
  }

  getUsers(): User[] {
    return this.dbService.getItems<User>("users");
  }

  addUser(admin: User): void {
    return this.dbService.addItem(admin, "users");
  }

  removeUsers(id: number): void {
    return this.dbService.removeItem(id, "users");
  }

  isAuthorized(id: number): boolean {
    return this.authService.isAuthorized(this.getUser(id));
  }
}
