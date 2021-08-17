import { Injector, Injectable, Inject, Ctx, Context, Scoped, Scope, STATIC_CONTEXT } from "../../src";

describe('Instance scope', function () {
  test('should inject new instance per instance', function () {
    @Injectable({
      scope: Scope.INSTANCE,
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

  test('should have another Context than STATIC_CONTEXT', function () {
    @Injectable({
      scope: Scope.INSTANCE,
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
    expect(service.service1 === service.service2).toEqual(true);
    expect(service.service1.context === STATIC_CONTEXT).toEqual(false);
    expect(service.service2.context === STATIC_CONTEXT).toEqual(false);
    expect(service.service1.context === service.service2.context).toEqual(true);
  });

  test('should by default inject passed custom Context (should behaves like Default scope)', function () {
    const ctx = new Context();

    @Injectable({
      scope: Scope.INSTANCE,
    })
    class TestService {
      constructor(
        public readonly context: Context,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly newService1: TestService,
        readonly newService2: TestService,
        @Inject(Ctx(ctx)) readonly ctxService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service) as Service;
    expect(service.newService1).toBeInstanceOf(TestService);
    expect(service.newService2).toBeInstanceOf(TestService);
    expect(service.ctxService).toBeInstanceOf(TestService);
    expect(service.newService1 === service.newService2).toEqual(true);
    expect(service.newService1 === service.ctxService).toEqual(false);
    expect(service.newService1.context === STATIC_CONTEXT).toEqual(false);
    expect(service.newService2.context === STATIC_CONTEXT).toEqual(false);
    expect(service.ctxService.context === ctx).toEqual(true);
  });

  test('should not use the passed custom Context if reuseContext option is set to false', function () {
    const ctx = new Context();

    @Injectable({
      scope: {
        kind: Scope.INSTANCE,
        options: {
          reuseContext: false,
        }
      }
    })
    class TestService {
      constructor(
        public readonly context: Context,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly newService1: TestService,
        readonly newService2: TestService,
        @Inject(Ctx(ctx)) readonly ctxService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service) as Service;
    expect(service.newService1).toBeInstanceOf(TestService);
    expect(service.newService2).toBeInstanceOf(TestService);
    expect(service.ctxService).toBeInstanceOf(TestService);
    expect(service.newService1 === service.newService2).toEqual(true);
    expect(service.newService1 === service.ctxService).toEqual(true);
    expect(service.newService1.context === STATIC_CONTEXT).toEqual(false);
    expect(service.newService2.context === STATIC_CONTEXT).toEqual(false);
    expect(service.ctxService.context === STATIC_CONTEXT).toEqual(false);
    expect(service.newService1.context === service.ctxService.context).toEqual(true);
    expect(service.ctxService.context === ctx).toEqual(false);
  });

  test('should be able to be replaced by another scope', function () {
    @Injectable({
      scope: Scope.INSTANCE,
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
