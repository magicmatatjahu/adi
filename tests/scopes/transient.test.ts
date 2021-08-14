import { Injector, Injectable, Inject, Ctx, Context, Scoped, Scope, STATIC_CONTEXT } from "../../src";

describe('Transient scope', function () {
  test('should inject new instance per single injection', function () {
    @Injectable({
      scope: Scope.TRANSIENT,
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
    expect(service.service1 === service.service2).toEqual(false);
  });

  test('should have another Context than STATIC_CONTEXT', function () {
    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TestService {
      constructor(
        public readonly context: Context,
      ) {}
    }

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
    expect(service.service1 === service.service2).toEqual(false);
    expect(service.service1.context === STATIC_CONTEXT).toEqual(false);
    expect(service.service2.context === STATIC_CONTEXT).toEqual(false);
    expect(service.service1.context === service.service2.context).toEqual(false);
  });

  test('should always inject passed custom Context', function () {
    const ctx = new Context();

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TestService {
      constructor(
        public readonly context: Context,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly newService: TestService,
        @Inject(Ctx(ctx)) readonly ctxService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service) as Service;
    expect(service.newService).toBeInstanceOf(TestService);
    expect(service.ctxService).toBeInstanceOf(TestService);
    expect(service.newService === service.ctxService).toEqual(false);
    expect(service.newService.context === STATIC_CONTEXT).toEqual(false);
    expect(service.ctxService.context === ctx).toEqual(true);
  });

  test('should be able to be replaced by another scope', function () {
    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TestService {
      constructor(
        public readonly context: Context,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(Scoped(Scope.SINGLETON)) readonly singletonService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.singletonService).toBeInstanceOf(TestService);
    expect(service.service === service.singletonService).toEqual(false);
    expect(service.service.context === STATIC_CONTEXT).toEqual(false);
    expect(service.singletonService.context === STATIC_CONTEXT).toEqual(true);
  });
});