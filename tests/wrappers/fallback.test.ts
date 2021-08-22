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

  test('should inject existing provider in injector', function () {
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
      TestService,
      {
        provide: "token",
        useValue: "foobar"
      }
    ]);

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(TestService);
  });

  test('should throw error when fallback does not exist', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Fallback('foobar')) readonly service: TestService
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

  test('should works in definition based useWrapper', function () {
    class Service {}

    const injector = new Injector([
      {
        provide: "lol",
        useValue: "foobar"
      },
      {
        provide: Service,
        useWrapper: Fallback('lol'),
      }
    ]);

    const service = injector.get(Service) as Service;
    expect(service).toEqual("foobar");
  });
});