import { Module, OnInit } from "../../../../src/di";

import { DBModule } from "./modules/db/db.module"
import { UsersModule } from "./modules/users/users.module"
import { AdminsModule } from "./modules/admins/admins.module"

import { testProfile } from './constants';

@Module({
  imports: [
    DBModule,
    UsersModule,
    AdminsModule,
  ],
})
export class AppModule implements OnInit {
  onInit() {
    testProfile.initOrder.push("AppModule")
  }
}
