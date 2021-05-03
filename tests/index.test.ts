import { Injector, Injectable } from "../src";

describe('test', function() {
  test('test', function() {
    @Injectable()
    class ServiceA {
      constructor(
        private service: string,
      ) {}
    }

    @Injectable()
    class ServiceB {
      constructor(
        private service: ServiceA,
      ) {}
    }

    const injector = new Injector([
      ServiceA,
      ServiceB,
    ]);

    const serviceB = injector.get(ServiceB);
    console.log(serviceB);

    expect(true).toEqual(true);
  });
});
