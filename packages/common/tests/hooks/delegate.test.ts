import { Injector, Injectable, Inject, createWrapper } from "@adi/core";

import { Delegate } from "../../src/hooks";

describe('Delegate wrapper', function () {
  test('should works without Factory, Decorate or Delegations wrapper', function () {
    let called: boolean = false;
    const TestWrapper = createWrapper(() => {
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
          Delegate(),
        ]) 
        readonly service: TestService,
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
