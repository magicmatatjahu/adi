import { Injectable, Inject } from "../../../../src/di/decorators";
import { OnInit } from "../../../../src/di/interfaces";
import { forwardRef } from "../../../../src/di/utils";
import { CircularCService } from "./circularC.service";
import { CircularDService } from "./circularD.service";
import { increment } from "./init-order"

@Injectable()
export class CircularEService implements OnInit {
  constructor(
    @Inject(forwardRef(() => CircularCService)) readonly circularC: CircularCService,
    @Inject(forwardRef(() => CircularDService)) readonly circularD: CircularDService,
  ) {}

  onInit() {
    if (Object.keys(this.circularC).length && Object.keys(this.circularD).length) {
      increment("E");
    }
  }
};
