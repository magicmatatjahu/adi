import { Injector, Injectable } from "@adi/core";
import { inject } from "../../../src";

describe('Without inject plugin', function () {
  test('should not work', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      testService: TestService;

      constructor() {
        this.testService = inject(TestService);
      }
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    expect(() => injector.get(Service)).toThrow('inject() must be called from an injection context such as a constructor, a factory function or field initializer.');
  });
});
