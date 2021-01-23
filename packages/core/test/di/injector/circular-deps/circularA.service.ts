import { Injectable, Inject } from "../../../../src/di/decorators";
import { OnInit } from "../../../../src/di/interfaces";
import { STATIC_CONTEXT } from "../../../../src/di/constants";
import { CONTEXT } from "../../../../src/di/providers";
import { Context } from "../../../../src/di/tokens";
import { forwardRef } from "../../../../src/di/utils";
import { CircularBService } from "./circularB.service";
import { CircularCService } from "./circularC.service";
import { asyncIncrement } from "./init-order"

@Injectable()
export class CircularAService implements OnInit {
  constructor(
    @Inject(forwardRef(() => CircularBService)) readonly circularB: CircularBService,
    @Inject(forwardRef(() => CircularCService)) readonly circularC: CircularCService,
    @Inject(CONTEXT) public readonly ctx: Context,
  ) {}

  async onInit() {
    if (Object.keys(this.circularB).length && Object.keys(this.circularC).length) {
      if (this.ctx !== STATIC_CONTEXT) {
        await asyncIncrement("NewA");
      } else {
        await asyncIncrement("A");
      }
    }
  }
};
