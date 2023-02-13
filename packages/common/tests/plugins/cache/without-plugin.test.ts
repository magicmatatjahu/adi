import { Injector, Injectable, Inject, createHook, TransientScope } from "@adi/core";

describe('Without cache plugin', function () {
  test('should cache injection with simple provider (with default scope)', function () {
    let calls = 0;

    const TestHook = createHook(() => {
      return (session, next) => {
        const value = next(session);
        calls++;
        return value;
      }
    });

    @Injectable()
    class TestService {}

    // use Transient scope to create Service on each injector.get(...)
    @Injectable({ scope: TransientScope })
    class Service {
      constructor(
        @Inject(TestHook()) readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service1 = injector.get(Service) as Service;
    const service2 = injector.get(Service) as Service;
    const service3 = injector.get(Service) as Service;

    expect(service1.service).toBeInstanceOf(TestService);
    expect(service1.service).toEqual(service2.service);
    expect(service1.service).toEqual(service3.service);
    expect(calls).toEqual(3);
  });
});
