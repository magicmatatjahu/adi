import { Injector, Injectable, Inject, Skip } from "../../src";

describe('Skip injection hook', function () {
  test('should skip injection', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject([Skip()]) readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toEqual(undefined);
  });
});
