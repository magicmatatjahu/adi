import { Injector, Injectable, Inject, Ref } from "../../src";

describe('Ref injection hook', function() {
  test('should wrap reference to function and forward it', function() {
    @Injectable()
    class ServiceA {
      constructor(
        @Inject([Ref(() => ServiceB)]) readonly serviceB: any,
      ) {}
    }

    @Injectable()
    class ServiceB {}

    const injector = Injector.create([
      ServiceA,
      ServiceB,
    ]).init() as Injector;

    const service = injector.get(ServiceA) as ServiceA;
    expect(service).toBeInstanceOf(ServiceA);
    expect(service.serviceB).toBeInstanceOf(ServiceB);
  });

  test('should wrap reference to function and forward it (circular ref case)', function() {
    @Injectable()
    class ServiceA {
      constructor(
        @Inject([Ref(() => ServiceB)]) readonly serviceB: any,
      ) {}
    }

    @Injectable()
    class ServiceB {
      constructor(
        @Inject([Ref(() => ServiceA)]) readonly serviceA: any,
      ) {}
    }

    const injector = Injector.create([
      ServiceA,
      ServiceB,
    ]).init() as Injector;

    const service = injector.get(ServiceA) as ServiceA;
    expect(service).toBeInstanceOf(ServiceA);
    expect(service.serviceB).toBeInstanceOf(ServiceB);
    expect(service.serviceB.serviceA).toBeInstanceOf(ServiceA);
    expect(service === service.serviceB.serviceA).toEqual(true);
  });
});
