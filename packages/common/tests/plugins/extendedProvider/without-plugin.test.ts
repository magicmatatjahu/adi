import { Injector, Injectable } from "@adi/core";

describe('Without extended provider plugin', function () {
  test('should not work', function () {
    @Injectable()
    class TestService {}

    @Injectable({
      providers: [
        TestService,
      ]
    })
    class Service {
      constructor(
        public testService: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
    ]).init() as Injector;

    expect(() => injector.get(Service)).toThrow();
    expect(() => injector.get(TestService)).toThrow();
  });
});
