import { Injector, Injectable, Inject, NewRef } from "../../src";

describe('Ref wrapper', function() {
  test('should wrap reference to function and forward it', function() {
    @Injectable()
    class ServiceA {
      constructor(
        @Inject(NewRef(() => ServiceB)) readonly serviceB: ServiceB,
      ) {}
    }

    @Injectable()
    class ServiceB {}

    const injector = new Injector([
      ServiceA,
      ServiceB,
    ]);

    const service = injector.newGet(ServiceA) as ServiceA;
    expect(service).toBeInstanceOf(ServiceA);
    expect(service.serviceB).toBeInstanceOf(ServiceB);
  });

  test('should wrap reference to function and forward it (circular ref case)', function() {
    @Injectable()
    class ServiceA {
      constructor(
        @Inject(NewRef(() => ServiceB)) readonly serviceB: ServiceB,
      ) {}
    }

    @Injectable()
    class ServiceB {
      constructor(
        @Inject(NewRef(() => ServiceA)) readonly serviceA: ServiceA,
      ) {}
    }

    const injector = new Injector([
      ServiceA,
      ServiceB,
    ]);

    const service = injector.newGet(ServiceA) as ServiceA;
    expect(service).toBeInstanceOf(ServiceA);
    expect(service.serviceB).toBeInstanceOf(ServiceB);
    expect(service.serviceB.serviceA).toBeInstanceOf(ServiceA);
    expect(service === service.serviceB.serviceA).toEqual(true);
  });
});