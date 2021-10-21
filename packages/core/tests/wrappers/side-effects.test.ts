import { Injector, Injectable, Inject, NewSideEffects, Scope, createNewWrapper } from "../../src";

describe('SideEffects wrapper', function () {
  test('should call wrapper chain on each injector.get(...)', function () {
    let calls = 0;

    const TestWrapper = createNewWrapper(() => {
      return (session, next) => {
        const value = next(session);
        session.setSideEffect(false);
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
        @Inject([
          NewSideEffects(),
          TestWrapper(),
        ])
        readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service1 = injector.newGet(Service);
    const service2 = injector.newGet(Service);
    const service3 = injector.newGet(Service);

    expect(service1.service).toBeInstanceOf(TestService);
    expect(service1.service).toEqual(service2.service);
    expect(service1.service).toEqual(service3.service);
    expect(calls).toEqual(3);
  });
});