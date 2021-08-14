import { Injector, Injectable, Inject, Ctx, Context, Scoped, Scope, STATIC_CONTEXT } from "../../src";

// TODO: Fix tests if scope has ability to pass custom options
describe('Instance scope', function () {
  test('should inject shared service in the given scope (using toScope option) - nearest case', function () {
    @Injectable({
      scope: Scope.LOCAL,
    })
    class SharedService {}

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TempService {
      constructor(
        readonly service: SharedService,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
      annotations: {
        '$$local.scope': 'test'
      }
    })
    class Service {
      constructor(
        readonly sharedService: SharedService,
        readonly newService: TempService,
      ) {}
    }

    const injector = new Injector([
      SharedService,
      TempService,
      Service,
    ]);

    const service1 = injector.get(Service) as Service;
    const service2 = injector.get(Service) as Service;
    expect(service1 === service2).toEqual(false);
    expect(service1.sharedService).toBeInstanceOf(SharedService);
    expect(service1.newService).toBeInstanceOf(TempService);
    expect(service1.newService.service).toBeInstanceOf(SharedService);
    expect(service2.sharedService).toBeInstanceOf(SharedService);
    expect(service2.newService).toBeInstanceOf(TempService);
    expect(service2.newService.service).toBeInstanceOf(SharedService);
    expect(service1.sharedService === service2.sharedService).toEqual(false);
    expect(service1.newService === service2.newService).toEqual(false);
    expect(service1.newService.service === service2.newService.service).toEqual(false);
    // most important - instance of SharedService is shared across Service subgraph
    expect(service1.sharedService === service1.newService.service).toEqual(true);
    expect(service2.sharedService === service2.newService.service).toEqual(true);
  });

  test('should inject shared service in the given scope (using toScope option) - farthest case', function () {
    @Injectable({
      scope: Scope.LOCAL,
    })
    class SharedService {}

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TempService {
      constructor(
        readonly service: SharedService,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
      annotations: {
        '$$local.scope': 'test'
      }
    })
    class ServiceBetween {
      constructor(
        readonly sharedService: SharedService,
        readonly newService: TempService,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
      annotations: {
        '$$local.scope': 'test'
      }
    })
    class Service {
      constructor(
        readonly betweenService1: ServiceBetween,
        readonly betweenService2: ServiceBetween,
      ) {}
    }

    const injector = new Injector([
      SharedService,
      ServiceBetween,
      TempService,
      Service,
    ]);

    const service1 = injector.get(Service) as Service;
    const service2 = injector.get(Service) as Service;
    expect(service1 === service2).toEqual(false);
    expect(service1.betweenService1 === service1.betweenService2).toEqual(false);
    expect(service2.betweenService1 === service2.betweenService2).toEqual(false);
    expect(service1.betweenService1.newService.service === service1.betweenService1.sharedService).toEqual(true);
    expect(service1.betweenService2.newService.service === service1.betweenService2.sharedService).toEqual(true);
    expect(service2.betweenService1.newService.service === service2.betweenService1.sharedService).toEqual(true);
    expect(service2.betweenService2.newService.service === service2.betweenService2.sharedService).toEqual(true);
    expect(service1.betweenService1.sharedService === service1.betweenService2.sharedService).toEqual(true);
    expect(service2.betweenService1.sharedService === service2.betweenService2.sharedService).toEqual(true);
    expect(service1.betweenService1.sharedService === service2.betweenService1.sharedService).toEqual(false);
    expect(service1.betweenService1.sharedService).toBeInstanceOf(SharedService);
    expect(service1.betweenService2.sharedService).toBeInstanceOf(SharedService);
    expect(service2.betweenService1.sharedService).toBeInstanceOf(SharedService);
    expect(service2.betweenService2.sharedService).toBeInstanceOf(SharedService);
  });

  test('should inject shared service in the given scope (using toScope option) - custom depth case', function () {
    @Injectable({
      scope: Scope.LOCAL,
    })
    class SharedService {}

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TempService {
      constructor(
        readonly service: SharedService,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
      annotations: {
        '$$local.scope': 'test'
      }
    })
    class ServiceBetween2 {
      constructor(
        readonly sharedService: SharedService,
        readonly newService: TempService,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
      annotations: {
        '$$local.scope': 'test'
      }
    })
    class ServiceBetween1 {
      constructor(
        readonly shared: SharedService,
        readonly betweenService: ServiceBetween2,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
      annotations: {
        '$$local.scope': 'test'
      }
    })
    class Service {
      constructor(
        readonly betweenService1: ServiceBetween1,
        readonly betweenService2: ServiceBetween1,
      ) {}
    }

    const injector = new Injector([
      SharedService,
      ServiceBetween1,
      ServiceBetween2,
      TempService,
      Service,
    ]);

    const service1 = injector.get(Service) as Service;
    const service2 = injector.get(Service) as Service;
    expect(service1 === service2).toEqual(false);
    expect(service1.betweenService1 === service1.betweenService2).toEqual(false);
    expect(service2.betweenService1 === service2.betweenService2).toEqual(false);
    expect(service1.betweenService1.betweenService === service1.betweenService2.betweenService).toEqual(false);
    expect(service2.betweenService1.betweenService === service2.betweenService2.betweenService).toEqual(false);
    expect(service1.betweenService1.betweenService.sharedService === service1.betweenService2.betweenService.newService.service).toEqual(true);
    expect(service2.betweenService1.betweenService.sharedService === service2.betweenService2.betweenService.newService.service).toEqual(true);
    expect(service1.betweenService1.betweenService.sharedService === service2.betweenService2.betweenService.newService.service).toEqual(false);



    // expect(service1.betweenService2.newService.service === service1.betweenService2.sharedService).toEqual(true);
    // expect(service2.betweenService1.newService.service === service2.betweenService1.sharedService).toEqual(true);
    // expect(service2.betweenService2.newService.service === service2.betweenService2.sharedService).toEqual(true);
    // expect(service1.betweenService1.sharedService === service1.betweenService2.sharedService).toEqual(true);
    // expect(service2.betweenService1.sharedService === service2.betweenService2.sharedService).toEqual(true);
    // expect(service1.betweenService1.sharedService === service2.betweenService1.sharedService).toEqual(false);
    // expect(service1.betweenService1.sharedService).toBeInstanceOf(SharedService);
    // expect(service1.betweenService2.sharedService).toBeInstanceOf(SharedService);
    // expect(service2.betweenService1.sharedService).toBeInstanceOf(SharedService);
    // expect(service2.betweenService2.sharedService).toBeInstanceOf(SharedService);
  });

  test('should behaves like Singleton scope if local scope (by token or name of scope) is not defined', function () {
    @Injectable({
      scope: Scope.LOCAL,
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
    expect(service.service1.context === STATIC_CONTEXT).toEqual(true);
    expect(service.service2.context === STATIC_CONTEXT).toEqual(true);
    expect(service.service1.context === service.service2.context).toEqual(true);
  });

  test('should behaves as Singleton scope if any ancestor has not defined the toScope and toToken options', function () {
    @Injectable({
      scope: Scope.LOCAL,
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
    expect(service.service1.context === STATIC_CONTEXT).toEqual(true);
    expect(service.service2.context === STATIC_CONTEXT).toEqual(true);
    expect(service.service1.context === service.service2.context).toEqual(true);
  });

  test('should always inject passed custom Context (should behaves like Default scope)', function () {
    const ctx = new Context();

    @Injectable({
      scope: Scope.LOCAL,
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
        @Inject(Ctx(ctx)) readonly ctxService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.ctxService).toBeInstanceOf(TestService);
    expect(service.service === service.ctxService).toEqual(false);
    expect(service.service.context === STATIC_CONTEXT).toEqual(true);
    expect(service.ctxService.context === ctx).toEqual(true);
  });

  test('should be able to be replaced by another scope', function () {
    @Injectable({
      scope: Scope.LOCAL,
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
        @Inject(Scoped(Scope.TRANSIENT)) readonly newService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.newService).toBeInstanceOf(TestService);
    expect(service.service === service.newService).toEqual(false);
    expect(service.service.context === STATIC_CONTEXT).toEqual(true);
    expect(service.newService.context === STATIC_CONTEXT).toEqual(false);
  });
});
