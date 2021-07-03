import { Injector, Injectable, Inject, Memo, New, Scope, createWrapper } from "../../src";

describe('Memo wrapper', function () {
  test('should memoize injection even when injection has side effects', function () {
    let calls = 0;

    const TestWrapper = createWrapper((_: never) => {
      return (injector, session, next) => {
        const value = next(injector, session);
        session['$$sideEffects'] = true;
        calls++;
        return value;
      }
    });

    @Injectable()
    class TestService {}

    // use Transient scope to create Service on each injector.get(...)
    @Injectable({ scope: Scope.TRANSIENT })
    class Service {
      constructor(
        @Inject(Memo(TestWrapper(New()))) readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service1 = injector.get(Service) as Service;
    const service2 = injector.get(Service) as Service;
    const service3 = injector.get(Service) as Service;

    expect(service1.service).toBeInstanceOf(TestService);
    expect(service1.service).toEqual(service2.service);
    expect(service1.service).toEqual(service3.service);
    expect(calls).toEqual(1);
  });
});
