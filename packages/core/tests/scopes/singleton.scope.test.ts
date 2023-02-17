import { Injector, Injectable, Inject, Ctx, Context, Scope, OnDestroy, DestroyableType, Destroyable, Module, SingletonScope, TransientScope } from "../../src";

describe('Singleton scope', function () {
  test('should always inject this same value', function () {
    @Injectable({
      scope: SingletonScope,
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

  test('should throw error if custom Context (not STATIC_CONTEXT) is passed', function () {
    const ctx = new Context();

    @Injectable({
      scope: SingletonScope,
    })
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        public readonly service: TestService,
        @Inject([Ctx(ctx)]) readonly ctxService1: TestService,
        @Inject([Ctx(ctx)]) readonly ctxService2: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    let error: any, instance: Service | undefined;
    try {
      instance = injector.get(Service) as Service;
    } catch(err) {
      error = err;
    }
    expect(error === undefined).toEqual(false);
    expect(instance === undefined).toEqual(true);
  });

  test('should create another instance per injector', function () {
    @Injectable({
      scope: SingletonScope({ perInjector: true }),
    })
    class TestService {}

    @Injectable()
    class Service1 {
      constructor(
        readonly service: TestService,
      ) {}
    }

    @Injectable()
    class Service2 {
      constructor(
        readonly service: TestService,
      ) {}
    }

    @Injectable()
    class ChildService1 {
      constructor(
        readonly service: TestService,
      ) {}
    }

    @Injectable()
    class ChildService2 {
      constructor(
        readonly service: TestService,
      ) {}
    }

    const parentInjector = Injector.create([
      Service1,
      Service2,
      TestService,
    ]).init() as Injector;
    const childInjector = Injector.create([
      ChildService1,
      ChildService2,
    ], undefined, parentInjector).init() as Injector;

    const service1 = parentInjector.get(Service1) as Service1;
    const service2 = parentInjector.get(Service2) as Service2;
    expect(service1.service).toBeInstanceOf(TestService);
    expect(service2.service).toBeInstanceOf(TestService);
    expect(service1.service === service2.service).toEqual(true);
    const childService1 = childInjector.get(ChildService1) as ChildService1;
    const childService2 = childInjector.get(ChildService2) as ChildService2;
    expect(childService1.service).toBeInstanceOf(TestService);
    expect(childService2.service).toBeInstanceOf(TestService);
    expect(childService1.service === childService2.service).toEqual(true);
    expect(service1.service === childService1.service).toEqual(false);
  });

  test('should destroy on injector event' , async function() {
    let destroyOrder: string[] = [];

    @Injectable({
      scope: SingletonScope,
    })
    class TestService {
      onDestroy() {
        destroyOrder.push('testService');
      }
    }

    @Injectable({
      scope: SingletonScope,
    })
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
    ]).init() as Injector;

    injector.get(Service);
    injector.get(Service);

    await injector.destroy();
    expect(destroyOrder).toEqual(['service', 'testService']);
  });

  test('should not destroy on manually event' , async function() {
    let destroyOrder: string[] = [];

    @Injectable({
      scope: SingletonScope,
    })
    class SingletonService {
      onDestroy() {
        destroyOrder.push('singleton');
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
    ]).init() as Injector;

    let service = injector.get(TransientService, [Destroyable()]) as unknown as DestroyableType<TransientService>;
    expect(service.value).toBeInstanceOf(TransientService);
    await service.destroy();

    service = injector.get(TransientService, [Destroyable()]) as unknown as DestroyableType<TransientService>;
    expect(service.value).toBeInstanceOf(TransientService);
    await service.destroy();

    expect(destroyOrder).toEqual(['transient', 'transient']);
    await injector.destroy();
    expect(destroyOrder).toEqual(['transient', 'transient', 'singleton']);
  });

  test('should destroy instance after destroying the module where record for instance was saved' , async function() {
    let destroyOrder: string[] = [];

    @Injectable({
      scope: SingletonScope,
    })
    class Singleton {
      onDestroy() {
        destroyOrder.push('Singleton');
      }
    }

    @Module({
      providers: [
        Singleton,
      ],
      exports: [
        Singleton,
      ]
    })
    class ChildModule {
      constructor(
        readonly service: Singleton,
      ) {}

      onDestroy() {
        destroyOrder.push('ChildModule');
      }
    }

    @Injectable({
      scope: TransientScope,
    })
    class Transient implements OnDestroy {
      constructor(
        readonly service: Singleton,
      ) {}

      onDestroy() {
        destroyOrder.push('Transient');
      }
    }

    @Module({
      imports: [
        ChildModule,
      ],
      providers: [
        Transient,
      ]
    })
    class MainModule {
      onDestroy() {
        destroyOrder.push('MainModule');
      }
    }

    const injector = Injector.create(MainModule).init() as Injector;
    let service = injector.get(Transient, [Destroyable()]) as unknown as DestroyableType<Transient>;
    expect(service.value).toBeInstanceOf(Transient);

    const childInjector = injector.imports.get(ChildModule) as Injector;

    await childInjector.destroy();
    expect(destroyOrder).toEqual(['ChildModule']);

    // destroy transient service which has link to the singleton instance from ChildModule and check if it can be destroyed
    await service.destroy();
    expect(destroyOrder).toEqual(['ChildModule', 'Transient', 'Singleton']);

    await injector.destroy();
    expect(destroyOrder).toEqual(['ChildModule', 'Transient', 'Singleton', 'MainModule']);
  });

  test('should destroy instance per injector after destroying the module where new instance is used' , async function() {
    let destroyOrder: string[] = [];

    @Injectable({
      scope: SingletonScope({ perInjector: true }),
    })
    class Singleton {
      onDestroy() {
        destroyOrder.push('Singleton');
      }
    }

    @Module()
    class ChildModule {
      constructor(
        readonly service: Singleton,
      ) {}

      onDestroy() {
        destroyOrder.push('ChildModule');
      }
    }

    @Module({
      imports: [
        ChildModule,
      ],
      providers: [
        Singleton,
      ]
    })
    class MainModule {
      constructor(
        readonly service: Singleton,
      ) {}

      onDestroy() {
        destroyOrder.push('MainModule');
      }
    }

    const injector = Injector.create(MainModule).init() as Injector;
    const childInjector = injector.imports.get(ChildModule) as Injector;

    await childInjector.destroy();
    expect(destroyOrder).toEqual(['ChildModule', 'Singleton']);

    await injector.destroy();
    expect(destroyOrder).toEqual(['ChildModule', 'Singleton', 'MainModule', 'Singleton']);
  });
});