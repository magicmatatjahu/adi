import { Injector, Injectable, Inject, Fallback } from "../../src";

describe('Fallback wrapper', function () {
  test('should inject fallback provider when given provider doesnt exist in injector', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Fallback("token")) readonly service: TestService
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: "token",
        useValue: "foobar"
      }
    ]);

    const service = injector.get(Service) as Service;
    expect(service.service).toEqual("foobar");
  });

  test('should throw error when fallback doesnt exists', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Fallback(String)) readonly service: TestService
      ) {}
    }

    const injector = new Injector([
      Service,
    ]);

    let err, service;
    try {
      service = injector.get(Service) as Service;
    } catch(e) {
      err = e;
    }

    expect(service === undefined).toEqual(true);
    expect(err !== undefined).toEqual(true);
  });
});