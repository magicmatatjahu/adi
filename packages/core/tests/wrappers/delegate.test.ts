import { Injector, Inject, Injectable, Delegate, createWrapper } from "../../src";

describe('Delegate wrapper', function () {
  test('should works without Factory, Decorate or Delegations wrapper', function () {
    let called: boolean = false;
    const TestWrapper = createWrapper((_: never) => {
      return (injector, session, next) => {
        const value = next(injector, session);
        called = true;
        return value;
      }
    });

    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Delegate(TestWrapper())) readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(called).toEqual(true);
  });
});
