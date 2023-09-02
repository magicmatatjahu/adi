import { Injector, Injectable, Inject, Ctx, Context, OnDestroy, Destroyable, DestroyableType, TransientScope } from "../../src";

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

    const injector = Injector.create([
      Service,
      TestService,
    ])

    const service = injector.getSync(Service)
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

    const injector = Injector.create([
      Service,
      TestService,
    ])

    const service = injector.getSync(Service)
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.ctxService1).toBeInstanceOf(TestService);
    expect(service.ctxService2).toBeInstanceOf(TestService);
    expect(service.service === service.ctxService1).toEqual(false);
    expect(service.service === service.ctxService2).toEqual(false);
    expect(service.ctxService1 === service.ctxService2).toEqual(true);
  });

  test('should destroy on injector event' , async function() {
    let destroyOrder: string[] = [];

    @Injectable()
    class TestService {
      onDestroy() {
        destroyOrder.push('testService');
      }
    }

    @Injectable()
    class Service implements OnDestroy {
      constructor(
        readonly service1: TestService,
        readonly service2: TestService,
      ) {}

      onDestroy() {
        destroyOrder.push('service');
      }
    }

    const injector = Injector.create([
      Service,
      TestService,
    ])

    injector.get(Service);
    injector.get(Service);

    await injector.destroy();
    expect(destroyOrder).toEqual(['service', 'testService']);
  });

  test('should not destroy on manually event' , async function() {
    let destroyOrder: string[] = [];

    @Injectable()
    class SingletonService {
      onDestroy() {
        destroyOrder.push('default');
      }
    }

    @Injectable({
      scope: TransientScope,
    })
    class TransientService implements OnDestroy {
      constructor(
        readonly service1: SingletonService,
      ) {}

      onDestroy() {
        destroyOrder.push('transient');
      }
    }

    const injector = Injector.create([
      SingletonService,
      TransientService,
    ])

    let service = injector.getSync(TransientService, Destroyable())
    expect(service.value).toBeInstanceOf(TransientService);
    await service.destroy();

    service = injector.getSync(TransientService, Destroyable())
    expect(service.value).toBeInstanceOf(TransientService);
    await service.destroy();

    expect(destroyOrder).toEqual(['transient', 'transient']);
    await injector.destroy();
    expect(destroyOrder).toEqual(['transient', 'transient', 'default']);
  });
});
