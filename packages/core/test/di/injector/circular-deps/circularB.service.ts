import { Injectable, Inject, New } from "../../../../src/di/decorators";
import { OnInit } from "../../../../src/di/interfaces";
import { forwardRef } from "../../../../src/di/utils";
import { CircularAService } from "./circularA.service";
import { CircularDService } from "./circularD.service";
import { increment } from "./init-order"

@Injectable()
export class CircularBService implements OnInit {
  constructor(
    @Inject(forwardRef(() => CircularAService)) readonly circularA: CircularAService,
    @Inject(forwardRef(() => CircularDService)) readonly circularD: CircularDService,
    @New() @Inject(forwardRef(() => CircularAService)) readonly newCircularA: CircularAService,
  ) {}

  onInit() {
    if (Object.keys(this.circularA).length && Object.keys(this.circularD).length && Object.keys(this.newCircularA).length) {
      increment("B");
    }
  }
};
