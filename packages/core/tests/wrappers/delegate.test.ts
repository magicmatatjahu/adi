import { Injector, Inject, Injectable, NewDelegate, createNewWrapper } from "../../src";

describe('Delegate wrapper', function () {
  test('should works without Factory, Decorate or Delegations wrapper', function () {
    let called: boolean = false;
    const TestWrapper = createNewWrapper(() => {
      return (session, next) => {
        const value = next(session);
        called = true;
        return value;
      }
    });

    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject([
          TestWrapper(),
          NewDelegate(),
        ]) 
        readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(called).toEqual(true);
  });
});
