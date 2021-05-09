import { Injector, Injectable, Inject, Ref } from "../src";

describe('Circular refs', function() {
  test('should handle simple case, when one class needs second and vice versa', function() {
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
