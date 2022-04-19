import { Injector, Inject, Injectable } from "@adi/core";
import { Fallback, Value } from "../../src";

describe('Fallback wrapper', function () {
  test('should inject fallback provider when given provider does not exist in injector', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject([Fallback("token")]) readonly service: TestService
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: "token",
        useValue: "foobar"
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toEqual("foobar");
  });

  test('should inject existing provider in injector', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject([Fallback("token")]) readonly service: TestService
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: "token",
        useValue: "foobar"
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(TestService);
  });

  test('should work with hooks', async function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject([
          Fallback({
            token: 'token',
            hooks: [Value('a.b.c')],
          })
        ]) 
        readonly service: TestService
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: "token",
        useValue: {
          a: {
            b: {
              c: 'foobar'
            }
          }
        }
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toEqual("foobar");
  });

  test('should throw error when fallback does not exist', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject([Fallback('foobar')]) readonly service: TestService
      ) {}
    }

    const injector = Injector.create([
      Service,
    ]).init() as Injector;

    let err, service;
    try {
      service = injector.get(Service);
    } catch(e) {
      err = e;
    }

    expect(service === undefined).toEqual(true);
    expect(err === undefined).toEqual(false);
  });

  test('should work in definition based hooks', function () {
    class Service {}

    const injector = Injector.create([
      {
        provide: "foobar",
        useValue: "foobar"
      },
      {
        provide: Service,
        hooks: [Fallback('foobar')],
      }
    ]).init() as Injector;

    const service = injector.get(Service);
    expect(service).toEqual("foobar");
  });

  test('should work in async resolution', async function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject([Fallback("token")]) readonly service: TestService
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: "token",
        async useFactory() { return "foobar" },
      }
    ]).init() as Injector;

    const service = await injector.get(Service);
    expect(service.service).toEqual("foobar");
  });
});
