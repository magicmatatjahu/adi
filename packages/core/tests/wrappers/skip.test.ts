import { Injector, Injectable, Inject, Skip } from "../../src";

describe('Skip wrapper', function () {
  test('should skip injection', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Skip()) readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service) ;
    expect(service.service).toEqual(undefined);
  });
});
