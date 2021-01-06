import { Injectable, Inject } from "../../../../src/di/decorators";
import { OnInit } from "../../../../src/di/interfaces";
import { forwardRef } from "../../../../src/di/utils";
import { CircularAService } from "./circularA.service";
import { CircularDService } from "./circularD.service";
import { CircularEService } from "./circularE.service";
import { asyncIncrement } from "./init-order"

@Injectable()
export class CircularCService implements OnInit {
  constructor(
    @Inject(forwardRef(() => CircularAService)) readonly circularA: CircularAService,
    @Inject(forwardRef(() => CircularDService)) readonly circularD: CircularDService,
    @Inject(forwardRef(() => CircularEService)) readonly circularE: CircularEService,
  ) {}

  async onInit() {
    if (Object.keys(this.circularA).length && Object.keys(this.circularD).length && Object.keys(this.circularE).length) {
      await asyncIncrement("C");
    }
  }
};
