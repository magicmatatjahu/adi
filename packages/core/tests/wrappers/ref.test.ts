import { Injector, Injectable, Inject, Ref } from "../../src";

describe('Ref wrapper', function() {
  test('should wrap reference to function and forward it', function() {
    @Injectable()
    class ServiceA {
      constructor(
        @Inject(Ref(() => ServiceB)) readonly serviceB: ServiceB,
      ) {}
    }

    @Injectable()
    class ServiceB {}

    const injector = new Injector([
      ServiceA,
      ServiceB,
    ]);

    const service = injector.get(ServiceA) as ServiceA;
    expect(service).toBeInstanceOf(ServiceA);
    expect(service.serviceB).toBeInstanceOf(ServiceB);
  });

  test('should wrap reference to function and forward it (circular ref case)', function() {
    @Injectable()
    class ServiceA {
      constructor(
        @Inject(Ref(() => ServiceB)) readonly serviceB: ServiceB,
      ) {}
    }

    @Injectable()
    class ServiceB {
      constructor(
        @Inject(Ref(() => ServiceA)) readonly serviceA: ServiceA,
      ) {}
    }

    const injector = new Injector([
      ServiceA,
      ServiceB,
    ]);

    const service = injector.get(ServiceA) as ServiceA;
    expect(service).toBeInstanceOf(ServiceA);
    expect(service.serviceB).toBeInstanceOf(ServiceB);
    expect(service.serviceB.serviceA).toBeInstanceOf(ServiceA);
    expect(service === service.serviceB.serviceA).toEqual(true);
  });
});