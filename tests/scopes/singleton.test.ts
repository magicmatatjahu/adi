import { Injector, Injectable, Inject, Ctx, Context, Scoped, Scope } from "../../src";

describe('Singleton scope', function () {
  test('should always inject this same value', function () {
    @Injectable({
      scope: Scope.SINGLETON,
    })
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service1: TestService,
        readonly service2: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service) as Service;
    expect(service.service1).toBeInstanceOf(TestService);
    expect(service.service2).toBeInstanceOf(TestService);
    expect(service.service1 === service.service2).toEqual(true);
  });

  test('should throw error if custom Context (not STATIC_CONTEXT) is passed', function () {
    const ctx = new Context();

    @Injectable({
      scope: Scope.SINGLETON,
    })
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        public readonly service: TestService,
        @Inject(Ctx(ctx)) readonly ctxService1: TestService,
        @Inject(Ctx(ctx)) readonly ctxService2: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    let error: any, instance: Service;
    try {
      instance = injector.get(Service) as Service;
    } catch(err) {
      error = err;
    }
    expect(error === undefined).toEqual(false);
    expect(instance === undefined).toEqual(true);
  }); 

  test('should not be able to be replaced by another scope', function () {
    @Injectable({
      scope: Scope.SINGLETON,
    })
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(Scoped(Scope.SINGLETON)) readonly oldService: TestService,
        @Inject(Scoped(Scope.TRANSIENT)) readonly probablyNewService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.oldService).toBeInstanceOf(TestService);
    expect(service.probablyNewService).toBeInstanceOf(TestService);
    expect(service.service === service.oldService).toEqual(true);
    expect(service.service === service.probablyNewService).toEqual(true);
  });
});
