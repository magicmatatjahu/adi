import { Injector, Injectable, Inject, Ref } from "@adi/core";
import { Lazy } from "../../src/hooks";

describe('Lazy injection hook', function () {
  test('should create lazy injection - normal injection.get(...) invocation', function () {
    @Injectable()
    class Service {}

    const injector = Injector.create([
      {
        provide: Service,
        useClass: Service,
        hooks: [Lazy()],
      },
    ]).init() as Injector;

    const service = injector.get(Service) as () => Service;
    expect(service).toBeInstanceOf(Function);
    expect(service()).toBeInstanceOf(Service);
  });

  test('should create lazy injection - injection in class', function () {
    @Injectable()
    class LazyService {}

    @Injectable()
    class Service {
      @Inject(LazyService, [Lazy()])
      public lazyService: () => LazyService;
    }

    const injector = Injector.create([
      Service,
      LazyService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.lazyService).toBeInstanceOf(Function);
    expect(service.lazyService()).toBeInstanceOf(LazyService);
  });

  test.skip('should handle circular reference using additional hooks - using Decorate injection hook', function () {
    const onInitOrder: string[] = [];
    let serviceA: ServiceA | undefined;

    @Injectable()
    class ServiceA {
      public serviceB: ServiceB;

      constructor(
        @Inject([
          Ref(() => ServiceB),
          Lazy(),
          // Decorate({
          //   decorate(value: ServiceB) {
          //     if (value.serviceA === serviceA) {
          //       value.calledFromServiceA = true;
          //     }
          //     return value;
          //   },
          // }),
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
        @Inject([Ref(() => ServiceA)]) 
        readonly serviceA: ServiceA,
      ) {}

      onInit() {
        // check that serviceA is created and has serviceB property
        if (Object.keys(this.serviceA).length) {
          onInitOrder.push('ServiceB');
        }
      }
    }

    const injector = Injector.create([
      ServiceA,
      ServiceB,
    ]).init() as Injector;

    const service = injector.get(ServiceA) as ServiceA;
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
