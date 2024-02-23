import { Injectable, Inject, Injector, Skip } from "../../src";

describe('Skip injection hook', function () {
  test('should skip injection', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Skip()) readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ])

    const service = injector.getSync(Service)
    expect(service.service).toEqual(undefined);
  });
});