import { Injector, Injectable, Inject, Ctx, Context, Scope, STATIC_CONTEXT, OnDestroy, Destroyable, DestroyableType, SingletonScope, TransientScope } from "@adi/core";
import { InstanceScope, Scoped } from "../../src"

describe('Instance scope', function () {
  test('should inject new instance per instance', function () {
    @Injectable({
      scope: InstanceScope,
    })
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
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service1).toBeInstanceOf(TestService);
    expect(service.service2).toBeInstanceOf(TestService);
    expect(service.service1 === service.service2).toEqual(true);
  });

  test('should have another Context than STATIC_CONTEXT', function () {
    @Injectable({
      scope: InstanceScope,
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

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service1).toBeInstanceOf(TestService);
    expect(service.service2).toBeInstanceOf(TestService);
    expect(service.service1 === service.service2).toEqual(true);
    expect(service.service1.context === STATIC_CONTEXT).toEqual(false);
    expect(service.service2.context === STATIC_CONTEXT).toEqual(false);
    expect(service.service1.context === service.service2.context).toEqual(true);
  });

  test('should by default inject passed custom Context - should behave like Default scope', function () {
    const ctx = new Context();

    @Injectable({
      scope: InstanceScope,
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
        @Inject([Ctx(ctx)]) readonly ctxService: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

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
      scope: InstanceScope({ reuseContext: false }),
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
        @Inject([Ctx(ctx)]) readonly ctxService: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

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

  test('should inject this same instance in method injection', function () {
    @Injectable({
      scope: InstanceScope,
    })
    class TestService {}

    @Injectable()
    class Service {
      method(@Inject() service1?: TestService, @Inject() service2?: TestService) {
        return [service1, service2];
      }
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    const services1 = service.method();
    const services2 = service.method();
    expect(services1[0]).toBeInstanceOf(TestService);
    expect(services1[1]).toBeInstanceOf(TestService);
    expect(services1[0] === services1[1]).toEqual(true);
    expect(services2[0] === services2[1]).toEqual(true);
    expect(services1[0] === services2[0]).toEqual(true);
  });

  test('should be able to be replaced by another scope', function () {
    @Injectable({
      scope: InstanceScope,
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
        @Inject([Scoped(SingletonScope)]) readonly singletonService: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.singletonService).toBeInstanceOf(TestService);
    expect(service.service === service.singletonService).toEqual(false);
    expect(service.service.context === STATIC_CONTEXT).toEqual(false);
    expect(service.singletonService.context === STATIC_CONTEXT).toEqual(true);
  });

  test('should destroy only when parent instance is destroyed - using Singleton scope', async function() {
    let destroyOrder: string[] = [];

    @Injectable({
      scope: InstanceScope,
    })
    class TestService implements OnDestroy {
      onDestroy() {
        destroyOrder.push('instance');
      }
    }

    @Injectable({
      scope: SingletonScope,
    })
    class Service {
      constructor(
        public service1: TestService,
        public service2: TestService,
      ) {}

      onDestroy() {
        destroyOrder.push('singleton');
      }
    }

    const injector = Injector.create([
      TestService,
      Service,
    ]).init() as Injector;

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    await injector.destroy();
    expect(destroyOrder).toEqual([
      'singleton',
      'instance',
    ]);
  });

  test('should destroy only when parent instance is destroyed (using Transient scope)', async function() {
    let destroyOrder: string[] = [];

    @Injectable({
      scope: InstanceScope,
    })
    class TestService implements OnDestroy {
      onDestroy() {
        destroyOrder.push('instance');
      }
    }

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      constructor(
        public service1: TestService,
        public service2: TestService,
      ) {}

      onDestroy() {
        destroyOrder.push('transient');
      }
    }

    const injector = Injector.create([
      TestService,
      Service,
    ]).init() as Injector;

    injector.get(Service);
    injector.get(Service);

    await injector.destroy();
    expect(destroyOrder).toEqual([
      'transient',
      'instance',
      'transient',
      'instance',
    ]);
  });

  test('should not destroy using Destroyable interface when instance has at least single reference link to the parent instance', async function () {
    let destroyTimes: number = 0;

    @Injectable({
      scope: InstanceScope,
    })
    class TestService implements OnDestroy {
      onDestroy() {
        destroyTimes++;
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, [Destroyable()]) public testService1: DestroyableType<TestService>,
        @Inject(TestService, [Destroyable()]) public testService2: DestroyableType<TestService>,
      ) {}
    }

    const injector = Injector.create([
      TestService,
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.testService1.value).toBeInstanceOf(TestService);
    expect(service.testService2.value).toBeInstanceOf(TestService);

    service.testService1.destroy();
    service.testService2.destroy();

    expect(destroyTimes).toEqual(0);
  });

  test('should destroy using Destroyable interface - manually injection, treat scope as Singleton', async function () {
    let destroyTimes: number = 0;

    @Injectable({
      scope: InstanceScope,
    })
    class Service {
      onDestroy() {
        destroyTimes++;
      }
    }

    const injector = Injector.create([
      Service,
    ]).init() as Injector;

    let service = injector.get(Service, [Destroyable()]) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);
    await service.destroy();

    service = injector.get(Service, [Destroyable()]) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);
    await service.destroy();

    expect(destroyTimes).toEqual(0);
  });

  test('should destroy using Destroyable interface - manually injection using as parent the Transient scope', async function () {
    let destroyOrder: string[] = [];

    @Injectable({
      scope: InstanceScope,
    })
    class TestService implements OnDestroy {
      onDestroy() {
        destroyOrder.push('instance');
      }
    }

    @Injectable({
      scope: TransientScope,
    })
    class Service implements OnDestroy {
      constructor(
        public service1: TestService,
        public service2: TestService,
      ) {}

      onDestroy() {
        destroyOrder.push('transient');
      }
    }

    const injector = Injector.create([
      TestService,
      Service,
    ]).init() as Injector;

    let service = injector.get(Service, [Destroyable()]) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);
    await service.destroy();

    service = injector.get(Service, [Destroyable()]) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);
    await service.destroy();

    expect(destroyOrder).toEqual(['transient', 'instance', 'transient', 'instance']);
  });

  test('should not destroy in method injection' , async function() {
    let destroyTimes: number = 0;

    @Injectable({
      scope: InstanceScope,
    })
    class TestService implements OnDestroy {
      onDestroy() {
        destroyTimes++;
      }
    }

    @Injectable()
    class Service {
      method(@Inject() service1?: TestService, @Inject() service2?: TestService) {}
    }

    const injector = Injector.create([
      TestService,
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    service.method();
    service.method();
    service.method();
    service.method();
    service.method(); // call five times method

    expect(destroyTimes).toEqual(0);
  });

  test('should not destroy when user pass custom context - default destroy event, treat scope as Transient' , async function() {
    let destroyOrder: string[] = [];
    const instanceCtx = new Context(undefined, 'Instance ctx');

    @Injectable({
      scope: InstanceScope,
    })
    class InstanceService implements OnDestroy {
      onDestroy() {
        destroyOrder.push('instance');
      }
    }

    @Injectable({
      scope: TransientScope,
    })
    class TransientInstance implements OnDestroy {
      constructor(
        @Inject([Ctx(instanceCtx)]) public ctxService: InstanceService,
        public service: InstanceService,
      ) {}

      onDestroy() {
        destroyOrder.push('transient');
      }
    }

    @Injectable({
      scope: SingletonScope,
    })
    class Service implements OnDestroy {
      method(@Inject() service?: TransientInstance) {}

      onDestroy() {
        destroyOrder.push('singleton');
      }
    }

    const injector = Injector.create([
      InstanceService,
      TransientInstance,
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    service.method();

    // wait 5ms to resolve all promises in DestroyManager
    await new Promise(resolve => {
      setTimeout(() => {
        resolve(undefined);
      }, 5);
    });
    expect(destroyOrder).toEqual(['transient', 'instance']);

    await injector.destroy();

    // last instance is from TransientInstance created by 'instanceCtx' context
    expect(destroyOrder).toEqual(['transient', 'instance', 'instance', 'singleton']);
  });
});
