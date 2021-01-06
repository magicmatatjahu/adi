import { Injectable, Inject } from "../../../../src/di/decorators";
import { OnInit } from "../../../../src/di/interfaces";
import { forwardRef } from "../../../../src/di/utils";
import { CircularBService } from "./circularB.service";
import { CircularCService } from "./circularC.service";
import { CircularEService } from "./circularE.service";
import { asyncIncrement } from "./init-order"

@Injectable()
export class CircularDService implements OnInit {
  constructor(
    @Inject(forwardRef(() => CircularBService)) readonly circularB: CircularBService,
    @Inject(forwardRef(() => CircularCService)) readonly circularC: CircularCService,
    @Inject(forwardRef(() => CircularEService)) readonly circularE: CircularEService,
  ) {}

  async onInit() {
    if (Object.keys(this.circularB).length && Object.keys(this.circularC).length && Object.keys(this.circularE).length) {
      await asyncIncrement("D");
    }
  }
};
