import { createInjector } from "../../../src/di/injector";
import { OnInit } from "../../../src/di/interfaces";
import { Injectable, Inject, New } from "../../../src/di/decorators";
import { INQUIRER } from "../../../src/di";
import { forwardRef } from "../../../src/di/utils";
import { CircularAService } from "./circular-deps/circularA.service";
import { CircularBService } from "./circular-deps/circularB.service";
import { CircularCService } from "./circular-deps/circularC.service";
import { CircularDService } from "./circular-deps/circularD.service";
import { CircularEService } from "./circular-deps/circularE.service";
import { INIT_ORDER } from "./circular-deps/init-order";
import { Scope } from "../../../src/di/scopes";
import { expect } from 'chai';

describe('Static Injector - circular dependency', () => {
  // check this -> serviceA in serviceB cannot be undefined
  it('should resolve circular dependency', async () => {
    let circularA: CircularAService = undefined;
    let circularB: CircularBService = undefined
    let circularC: CircularCService = undefined;
    let circularD: CircularDService = undefined;
    let circularE: CircularEService = undefined;

    const injector = createInjector([CircularAService, CircularBService, CircularCService, CircularDService, CircularEService]);
    let error = undefined;
    try {
      circularA = await injector.resolve(CircularAService);
      circularB = await injector.resolve(CircularBService);
      circularC = await injector.resolve(CircularCService);
      circularD = await injector.resolve(CircularDService);
      circularE = await injector.resolve(CircularEService);
    } catch (err) {
      error = err;
    }
    expect(error).to.be.undefined;

    expect(circularA instanceof CircularAService).to.be.true;
    expect(circularB instanceof CircularBService).to.be.true;
    expect(circularC instanceof CircularCService).to.be.true;
    expect(circularD instanceof CircularDService).to.be.true;
    expect(circularE instanceof CircularEService).to.be.true;
    expect(circularA.circularB).to.be.equal(circularB);
    expect(circularA.circularC).to.be.equal(circularC);
    expect(circularB.circularA).to.be.equal(circularA);
    expect(circularB.circularD).to.be.equal(circularD);
    expect(circularC.circularA).to.be.equal(circularA);
    expect(circularC.circularD).to.be.equal(circularD);
    expect(circularC.circularE).to.be.equal(circularE);
    expect(circularD.circularB).to.be.equal(circularB);
    expect(circularD.circularC).to.be.equal(circularC);
    expect(circularD.circularE).to.be.equal(circularE);
    expect(circularE.circularC).to.be.equal(circularC);
    expect(circularE.circularD).to.be.equal(circularD);

    // with @New() flag
    expect(circularB.newCircularA).not.to.be.equal(circularA);
    expect(circularB.newCircularA.circularB).to.be.equal(circularB);
    expect(circularB.newCircularA.circularC).to.be.equal(circularC);

    expect(INIT_ORDER).to.be.deep.equal(["E", "C", "D", "NewA", "B", "A"]);
  });

  it('should resolve circular deps between this same class', async () => {
    @Injectable()
    class Service {
      constructor(
        public service: Service,
      ) {}
    }

    const injector = createInjector([Service]);
    const service = await injector.resolve(Service);
    expect(service).to.be.instanceOf(Service);
    expect(service.service).to.be.instanceOf(Service);
    expect(service.service).to.be.equal(service);
  });

  it('should resolve circular deps with property injection', async () => {
    @Injectable()
    class NormalService {}

    @Injectable()
    class ServiceA {
      @Inject()
      normal: NormalService

      constructor(
        @Inject(forwardRef(() => ServiceB)) public service: any,
      ) {}
    }

    @Injectable()
    class ServiceB {
      @Inject()
      normal: NormalService

      constructor(
        @Inject(forwardRef(() => ServiceA)) public service: any,
      ) {}
    }

    const injector = createInjector([NormalService, ServiceA, ServiceB]);
    const service = await injector.resolve(ServiceA);
    expect(service).to.be.instanceOf(ServiceA);
    expect(service.service).to.be.instanceOf(ServiceB);
    expect(service.service.service).to.be.equal(service);
    expect(service.normal).to.be.instanceOf(NormalService);
    expect(service.normal).to.be.equal(service.service.normal);
  });

  it('should throws error when class wants new instance (by TRANSIENT scope) of itself class', async () => {
    @Injectable({ scope: Scope.TRANSIENT })
    class Service {
      constructor(
        public service: Service,
      ) {}
    }

    const injector = createInjector([Service]);
    let error: Error = undefined;
    try {
      await injector.resolve(Service);
    } catch(e) {
      error = e;
    }
    expect(error).not.to.be.undefined;
    expect(error.message).to.be.equal("Cannot inject new instance of itself class (with TRANSIENT scope)");
  });

  it('should throws error when class wants new instance (by @New decorator) of itself class', async () => {
    @Injectable()
    class Service {
      constructor(
        @New() public service: Service,
      ) {}
    }

    const injector = createInjector([Service]);
    let error: Error = undefined;
    try {
      await injector.resolve(Service);
    } catch(e) {
      error = e;
    }
    expect(error).not.to.be.undefined;
    expect(error.message).to.be.equal("Cannot inject new instance of itself class (with TRANSIENT scope)");
  });

  it('should fire onInit in a proper order with simple circular deps', async () => {
    let order = [];

    @Injectable()
    class ServiceA implements OnInit {
      constructor(
        @Inject(forwardRef(() => ServiceB)) private readonly service: any,
      ) {}

      onInit() {
        if (Object.keys(this.service).length) {
          order.push("A");
        }
      }
    }

    @Injectable()
    class ServiceB implements OnInit {
      constructor(
        @Inject(forwardRef(() => ServiceA)) private readonly service: any,
      ) {}

      onInit() {
        if (Object.keys(this.service).length) {
          order.push("B");
        }
      }
    }

    const injector = createInjector([
      ServiceA,
      ServiceB,
    ]);
    await injector.resolve(ServiceA);

    expect(order).to.be.deep.equal(["B", "A"]);
  });

  it('should fire onInit in a proper order with deep circular deps', async () => {
    let order = [];

    @Injectable()
    class ServiceZero {
      public prop: string = "PropFromServiceZero";
    }

    @Injectable()
    class ServiceA implements OnInit {
      constructor(
        @Inject(forwardRef(() => ServiceB)) private readonly service: any,
      ) {}

      onInit() {
        if (Object.keys(this.service).length) {
          order.push("A");
        }
      }

      async method(@Inject() service?: ServiceZero): Promise<string> {
        return service?.prop;
      }
    }

    @Injectable()
    class ServiceB implements OnInit {
      constructor(
        @Inject(forwardRef(() => ServiceC)) private readonly service: any,
      ) {}

      onInit() {
        if (Object.keys(this.service).length) {
          order.push("B");
        }
      }
    }

    @Injectable()
    class ServiceC implements OnInit {
      constructor(
        @Inject(forwardRef(() => ServiceD)) private readonly service: any,
      ) {}

      onInit() {
        if (Object.keys(this.service).length) {
          order.push("C");
        }
      }
    }

    @Injectable()
    class ServiceD implements OnInit {
      constructor(
        private readonly service: ServiceA,
      ) {}

      onInit() {
        if (Object.keys(this.service).length) {
          order.push("D");
        }
      }
    }
  
    const injector = createInjector([
      ServiceZero,
      ServiceA,
      ServiceB,
      ServiceC,
      ServiceD,
    ]);
    const serviceA = await injector.resolve(ServiceA);

    expect(order).to.be.deep.equal(["D", "C", "B", "A"]);
    expect(await serviceA.method()).to.be.equal("PropFromServiceZero");
  });

  // TODO: Fix it - sometimes (in Circular Deps) it creates second instance of Inquirered type
  it.skip('should fire onInit in a proper order with deep circular deps and inquirer token', async () => {
    let order = [];

    @Injectable()
    class ZeroService implements OnInit {
      service: any = {};

      onInit() {
        order.push("Zero");
      }
    }

    @Injectable()
    class FirstService implements OnInit {
      constructor(
        public readonly zeroService: ZeroService,
        @Inject(INQUIRER) public readonly secondService: any,
      ) {}

      onInit() {
        if (Object.keys(this.zeroService).length && Object.keys(this.secondService).length) {
          order.push("First");
        }
      }
    }

    @Injectable()
    class SecondService implements OnInit {
      constructor(
        public readonly firstService: FirstService,
        @Inject(forwardRef(() => ThirdService)) public readonly thirdService: any,
      ) {}

      async onInit() {
        if (Object.keys(this.firstService).length && Object.keys(this.thirdService).length) {
          order.push("Second");
        }
      }
    }

    @Injectable()
    class ThirdService implements OnInit {
      constructor(
        @Inject(forwardRef(() => SecondService)) public readonly secondService: any,
      ) {}

      onInit() {
        if (Object.keys(this.secondService).length) {
          order.push("Third");
        }
      }
    }
  
    const injector = createInjector([
      ZeroService,
      FirstService,
      SecondService,
      ThirdService,
    ]);
    await injector.resolve(ThirdService);

    expect(order).to.be.deep.equal(["Zero", "First", "Second", "Third"]);
  });

  it('case with deep circular dependencies - using deep TRANSIENT scope and @New decorator', async () => {
    @Injectable()
    class FirstService {}
  });
});
