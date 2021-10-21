import { Injector, Injectable, Inject, NewValue } from "../../src";

describe('Value wrapper', function () {
  test('should inject value', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(NewValue('foobar')) readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toEqual('foobar');
  });
});
