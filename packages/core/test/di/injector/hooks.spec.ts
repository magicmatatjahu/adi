import { createInjector } from "../../../src/di/injector";
import { OnInit, OnDestroy } from "../../../src/di/interfaces";
import { Injectable, Inject, New } from "../../../src/di/decorators";
import { Context } from "../../../src/di/tokens";
import { Scope } from "../../../src/di/scopes";
import { expect } from 'chai';

describe('Hooks', () => {
  it('should fire onInit in a proper order', async () => {
    let order = [];

    @Injectable()
    class FirstService implements OnInit {
      onInit() {
        order.push("First");
      }
    }

    @Injectable()
    class SecondService implements OnInit {
      constructor(
        readonly firstService: FirstService,
      ) {}

      async onInit() {
        order.push("Second");
      }
    }

    @Injectable()
    class ThirdService implements OnInit {
      constructor(
        readonly secondService: SecondService,
      ) {}

      onInit() {
        order.push("Third");
      }
    }
  
    const injector = createInjector([
      FirstService,
      SecondService,
      ThirdService,
    ]);
    await injector.resolve(ThirdService);

    expect(order).to.be.deep.equal(["First", "Second", "Third"]);
  });

  it('should fire onInit and onDestroy in method injection', async () => {
    const ctx = new Context();
    const transientCtx = new Context();
    let increment = 0;
    let decrement = 0;

    @Injectable({ scope: Scope.TRANSIENT })
    class OnEveryCallService implements OnInit, OnDestroy {
      constructor() {}

      async onInit() {
        increment++;
      }

      async onDestroy() {
        decrement++;
      }
    }

    @Injectable()
    class Service implements OnInit, OnDestroy {
      constructor(
        private service: OnEveryCallService,
      ) {}

      async onInit() {
        increment++;
      }

      async onDestroy() {
        decrement++;
      }
    }

    @Injectable({ scope: Scope.TRANSIENT })
    class TransientService implements OnInit, OnDestroy {
      constructor(
        private service: Service,
        @New() private newService: Service,
      ) {}

      async onInit() {
        increment++;
      }

      async onDestroy() {
        decrement++;
      }
    }

    @Injectable()
    class MethodInjectionService {
      async run(
        @Inject() staticCtx?: Service, 
        @Inject(ctx) definedCtx?: Service, 
        @Inject() @New() newCtx?: Service,
      ): Promise<void> {}

      async runNew(@Inject() @New() newCtx?: Service): Promise<void> {}
      async runTransient(@Inject() newTransient?: TransientService, @Inject(transientCtx) transientWithCtx?: TransientService): Promise<void> {}
    }
  
    const injector = createInjector([OnEveryCallService, Service, TransientService, MethodInjectionService]);
    const instance = await injector.resolve(MethodInjectionService);
    await instance.run();
    // three onInit calls from Service and another three onInit from OnEveryCallService
    // two onDestroy calls -> injected new Service by @New() decorator and from OnEveryCallService
    expect(increment).to.be.equal(6);
    // expect(decrement).to.be.equal(2);
    // onInit calls from Service and OnEveryCallService -> @New() decorator
    // onDestroy calls from Service and OnEveryCallService
    await instance.run();
    expect(increment).to.be.equal(8);
    // expect(decrement).to.be.equal(4);
    // onInit calls from Service and OnEveryCallService -> @New() decorator
    // onDestroy calls from Service and OnEveryCallService
    await instance.run();
    expect(increment).to.be.equal(10);
    // expect(decrement).to.be.equal(6);

    // onInit calls from Service and OnEveryCallService -> @New() decorator
    // onDestroy calls from Service and OnEveryCallService
    await instance.runNew();
    expect(increment).to.be.equal(12);
    // expect(decrement).to.be.equal(8);

    // onInit calls from Service and OnEveryCallService -> @New() decorator
    // onDestroy calls from Service and OnEveryCallService
    await instance.runNew();
    expect(increment).to.be.equal(14);
    // expect(decrement).to.be.equal(10);

    // two onInit call and one onDestroy -> injected transient providers
    // create transient Provider with given ctx -> cache it, then on every next call create another transient provider without caching.
    await instance.runTransient();
    expect(increment).to.be.equal(20);
    // expect(decrement).to.be.equal(13);

    await instance.runTransient();
    expect(increment).to.be.equal(23);
    // expect(decrement).to.be.equal(16);

    await instance.runTransient();
    expect(increment).to.be.equal(26);
    // expect(decrement).to.be.equal(19);
  });

  it('should fire onInit and onDestroy in useFactory injection', async () => {
    const ctx = new Context();
    const transientCtx = new Context();
    let increment = 0;
    let decrement = 0;

    @Injectable()
    class Service implements OnInit, OnDestroy {
      constructor() {}

      async onInit() {
        increment++;
      }

      async onDestroy() {
        decrement++;
      }
    }

    @Injectable({ scope: Scope.TRANSIENT })
    class TransientService implements OnInit, OnDestroy {
      constructor() {}

      async onInit() {
        increment++;
      }

      async onDestroy() {
        decrement++;
      }
    }

    const injector = createInjector([{
      provide: "useFactory",
      useFactory: async () => {},
      inject: [
        Service,
        [Inject(Service), New()],
        [Inject(TransientService, transientCtx)], 
        [Inject(TransientService)],
      ],
      scope: Scope.TRANSIENT,
    }, Service, TransientService]);

    await injector.resolve("useFactory");
    expect(increment).to.be.equal(4);
    // expect(decrement).to.be.equal(2);

    await injector.resolve("useFactory");
    expect(increment).to.be.equal(6);
    // expect(decrement).to.be.equal(4);

    await injector.resolve("useFactory");
    expect(increment).to.be.equal(8);
    // expect(decrement).to.be.equal(6);
  });
});
