import { Injector, Injectable, Inject, Fallback, Value } from "../../src";

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

    const service = injector.get(Service) ;
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

    const service = injector.get(Service) ;
    expect(service.service).toBeInstanceOf(TestService);
  });

  test('should works with wrappers', async function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Fallback({
          token: 'token',
          useWrapper: Value('a.b.c'),
        })) readonly service: TestService
      ) {}
    }

    const injector = new Injector([
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
    ]);

    const service = await injector.getAsync(Service);
    expect(service.service).toEqual("foobar");
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
      service = injector.get(Service) ;
    } catch(e) {
      err = e;
    }

    expect(service === undefined).toEqual(true);
    expect(err === undefined).toEqual(false);
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

    const service = injector.get(Service) ;
    expect(service).toEqual("foobar");
  });

  test('should works in async resolution', async function () {
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

    const service = await injector.getAsync(Service);
    expect(service.service).toEqual("foobar");
  });
});