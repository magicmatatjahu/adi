import { Injector, Injectable, Inject, NewSkip } from "../../src";

describe('Skip wrapper', function () {
  test('should skip injection', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(NewSkip()) readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toEqual(undefined);
  });
});
