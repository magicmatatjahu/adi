import { Injector, Inject, Injectable } from "@adi/core";

import { Value } from "../../src/hooks";

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
