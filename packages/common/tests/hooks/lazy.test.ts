import { Injector, Injectable, Inject, Ref } from "@adi/core";

import { Decorate, Lazy } from "../../src/hooks";

describe('Lazy wrapper', function () {
  test('should create lazy injection - normal injection.get(...) invocation', function () {
    @Injectable()
    class TestService {}

    const injector = new Injector([
      TestService,
      {
        provide: TestService,
        useWrapper: Lazy(),
      },
    ]);

    const service = injector.get(TestService) as () => TestService;
    expect(service).toBeInstanceOf(Function);
    expect(service()).toBeInstanceOf(TestService);
  });

  test('should postpone creation - proxy case', function () {
    @Injectable()
    class LazyService {
      @Inject()
      public prop: String;
    }

    @Injectable()
    class TestService {
      @Inject(Lazy({ proxy: true }))
      public lazyService: LazyService;
    }

    const injector = new Injector([
      TestService,
      LazyService,
    ]);

    let err: Error, service: TestService;
    try {
      service = injector.get(TestService) as TestService;
    } catch(e) {
      err = e;
    }
    expect(err).toEqual(undefined);

    try {
      service.lazyService.prop;
    } catch(e) {
      err = e;
    }
    expect(err === undefined).toEqual(false);
  });

  test('should create proxy - proxy case', function () {
    @Injectable()
    class LazyService {
      @Inject()
      public prop: String;
    }

    @Injectable()
    class TestService {
      @Inject(Lazy({ proxy: true }))
      public lazyService: LazyService;
    }

    const injector = new Injector([
      TestService,
      LazyService,
      {
        provide: String,
        useValue: "foobar",
      }
    ]);

    const service = injector.get(TestService) as TestService;
    expect(service.lazyService).toBeInstanceOf(LazyService);
    expect(service.lazyService.prop).toEqual('foobar');
  });

  test('should handle circular reference using additional wrappers (in this case Decorate)', function () {
    let onInitOrder = [];
    let serviceA: ServiceA;

    @Injectable()
    class ServiceA {
      public serviceB: ServiceB;

      constructor(
        @Inject([
          Ref(() => ServiceB),
          Lazy(),
          Decorate({
            decorate(value: ServiceB) {
              if (value.serviceA === serviceA) {
                value.calledFromServiceA = true;
              }
              return value;
            },
          }),
        ])
        readonly lazyServiceB: () => ServiceB,
      ) {
        serviceA = this;
      }

      initServiceB() {
        this.serviceB = this.lazyServiceB();

        // check that serviceB is created and has serviceA property
        if (Object.keys(this.serviceB).length) {
          onInitOrder.push('ServiceA');
        }
      }
    }

    @Injectable()
    class ServiceB {
      public calledFromServiceA: boolean = false;

      constructor(
        @Inject(Ref(() => ServiceA)) 
        readonly serviceA: ServiceA,
      ) {}

      onInit() {
        // check that serviceA is created and has serviceB property
        if (Object.keys(this.serviceA).length) {
          onInitOrder.push('ServiceB');
        }
      }
    }

    const injector = new Injector([
      ServiceA,
      ServiceB,
    ]);

    const service = injector.get(ServiceA);
    expect(service).toBeInstanceOf(ServiceA);
    expect(service.lazyServiceB).toBeInstanceOf(Function);
    
    service.initServiceB();

    expect(service.serviceB).toBeInstanceOf(ServiceB);
    expect(service.serviceB.serviceA).toBeInstanceOf(ServiceA);
    expect(service === service.serviceB.serviceA).toEqual(true);
    expect(onInitOrder).toEqual(['ServiceB', 'ServiceA']);
    expect(service.serviceB.calledFromServiceA).toEqual(true);
  });
});