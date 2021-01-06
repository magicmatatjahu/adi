import { Module, ModuleType, OnInit } from "../../../../../../src/di";

import { UsersService } from "./users.service";

import { testProfile } from "../../constants";

@Module({
  type: ModuleType.DOMAIN,
  providers: [
    UsersService,
  ],
})
export class UsersModule implements OnInit {
  onInit() {
    testProfile.initOrder.push("UsersModule")
  }
}
