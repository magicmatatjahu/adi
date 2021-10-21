import { Injector, Injectable, Inject, NewFallback, Path, NewPath } from "../../src";

describe('Fallback wrapper', function () {
  test('should inject fallback provider when given provider doesnt exist in injector', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(NewFallback("token")) readonly service: TestService
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: "token",
        useValue: "foobar"
      }
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toEqual("foobar");
  });

  test('should inject existing provider in injector', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(NewFallback("token")) readonly service: TestService
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

    const service = injector.newGet(Service);
    expect(service.service).toBeInstanceOf(TestService);
  });

  test('should works with wrappers', async function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(
          NewFallback({
            token: 'token',
            useWrapper: NewPath('a.b.c'),
          })
        ) 
        readonly service: TestService
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

    const service = injector.newGet(Service);
    expect(service.service).toEqual("foobar");
  });

  test('should throw error when fallback does not exist', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(NewFallback('foobar')) readonly service: TestService
      ) {}
    }

    const injector = new Injector([
      Service,
    ]);

    let err, service;
    try {
      service = injector.newGet(Service);
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
        useWrapper: NewFallback('lol'),
      }
    ]);

    const service = injector.newGet(Service);
    expect(service).toEqual("foobar");
  });

  test('should works in async resolution', async function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(NewFallback("token")) readonly service: TestService
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: "token",
        useValue: "foobar"
      }
    ]);

    const service = await injector.newGetAsync(Service);
    expect(service.service).toEqual("foobar");
  });
});