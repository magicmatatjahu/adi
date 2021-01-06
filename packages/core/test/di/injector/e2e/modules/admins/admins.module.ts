import { Module, ModuleType, OnInit } from "../../../../../../src/di";

import { AdminsService } from "./admins.service";

import { testProfile } from "../../constants";

@Module({
  type: ModuleType.DOMAIN,
  providers: [
    AdminsService,
  ],
})
export class AdminsModule implements OnInit {
  onInit() {
    testProfile.initOrder.push("AdminsModule")
  }
}
