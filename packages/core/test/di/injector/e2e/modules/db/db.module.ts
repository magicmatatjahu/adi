import { Module, OnInit } from "../../../../../../src/di";

import { testProfile } from "../../constants";

@Module()
export class DBModule implements OnInit {
  onInit() {
    testProfile.initOrder.push("DBModule")
  }
}
