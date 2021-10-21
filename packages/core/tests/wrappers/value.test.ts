import { Injector, Injectable, Inject, Value } from "../../src";

describe('Value wrapper', function () {
  test('should inject value', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Value('foobar')) readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service);
    expect(service.service).toEqual('foobar');
  });
});
