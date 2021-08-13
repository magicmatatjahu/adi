import { Injector, Injectable, Inject, Ctx, Context, Scoped, Scope } from "../../src";

describe('Default scope', function () {
  test('should behaves as Singleton by default', function () {
    @Injectable()
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

  test('should inject new instance if custom Context is passed', function () {
    const ctx = new Context();

    @Injectable()
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

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.ctxService1).toBeInstanceOf(TestService);
    expect(service.ctxService2).toBeInstanceOf(TestService);
    expect(service.service === service.ctxService1).toEqual(false);
    expect(service.service === service.ctxService2).toEqual(false);
    expect(service.ctxService1 === service.ctxService2).toEqual(true);
  }); 

  test('should be able to be replaced by another scope', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(Scoped(Scope.SINGLETON)) readonly oldService: TestService,
        @Inject(Scoped(Scope.TRANSIENT)) readonly newService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.oldService).toBeInstanceOf(TestService);
    expect(service.newService).toBeInstanceOf(TestService);
    expect(service.service === service.oldService).toEqual(true);
    expect(service.service === service.newService).toEqual(false);
  });
});
