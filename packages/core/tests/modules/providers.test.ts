import { Injector, Injectable, Module, Inject, Scope, OnDestroy, DestroyableType, Destroyable, OnDestroyHook } from "../../src";

describe('Providers with ModuleMetadata', function() {
  test('should work with providers', async function() {
    @Injectable({
      providers: [
        {
          provide: 'foobar',
          useFactory() { return 'foobar' },
        },
      ]
    })
    class Service {
      constructor(
        @Inject('foobar') readonly foobar: string,
      ) {}
    }

    @Module({
      providers: [
        Service,
      ]
    })
    class MainModule {}

    const injector = Injector.create(MainModule).build();

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.foobar).toEqual('foobar');

    let foobar, error;
    try {
      foobar = injector.get('foobar');
    } catch(err) {
      error = err;
    }
    expect(foobar).toEqual(undefined);
    expect(error === undefined).toEqual(false);
  });

  test('should work with imports', async function() {
    @Module({
      providers: [
        {
          provide: 'foobar',
          useFactory() { return 'foobar' },
        },
      ],
      exports: [
        'foobar',
      ]
    })
    class ChildModule {}

    @Injectable({
      imports: [
        ChildModule,
      ],
    })
    class Service {
      constructor(
        @Inject('foobar') readonly foobar: string,
      ) {}
    }

    @Module({
      providers: [
        Service,
      ]
    })
    class MainModule {}

    const injector = Injector.create(MainModule).build();

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.foobar).toEqual('foobar');

    let foobar, error;
    try {
      foobar = injector.get('foobar');
    } catch(err) {
      error = err;
    }
    expect(foobar).toEqual(undefined);
    expect(error === undefined).toEqual(false);
  });

  test('should work with scopes', async function() {
    @Injectable()
    class TestService {}

    @Injectable({
      scope: Scope.TRANSIENT,
      providers: [
        TestService,
      ]
    })
    class Service {
      constructor(
        readonly service: TestService,
      ) {}
    }

    @Module({
      providers: [
        Service,
      ]
    })
    class MainModule {}

    const injector = Injector.create(MainModule).build();

    const service1 = injector.get(Service);
    expect(service1).toBeInstanceOf(Service);
    expect(service1.service).toBeInstanceOf(TestService);

    const service2 = injector.get(Service);
    expect(service2).toBeInstanceOf(Service);
    expect(service2.service).toBeInstanceOf(TestService);

    expect(service1 === service2).toEqual(false);
    expect(service1.service === service2.service).toEqual(false);

    let testService, error;
    try {
      testService = injector.get(TestService);
    } catch(err) {
      error = err;
    }
    expect(testService).toEqual(undefined);
    expect(error === undefined).toEqual(false);
  });

  test('should destroy when instance of provider is destroyed', async function() {
    const order: string[] = [];

    function hook(pushValue: string) {
      return function() {
        order.push(pushValue);
      }
    }

    @Injectable()
    class TestService implements OnDestroy {
      onDestroy() {
        order.push('TestService onDestroy');
      }
    }

    @Injectable({
      scope: Scope.TRANSIENT,
      providers: [
        TestService,
      ]
    })
    class Service implements OnDestroy {
      constructor(
        @Inject(OnDestroyHook({
          onDestroy: hook('TestService injection onDestroy'),
        })) readonly service: TestService,
      ) {}

      onDestroy() {
        order.push('Service onDestroy');
      }
    }

    @Module({
      providers: [
        Service,
      ]
    })
    class MainModule {}

    const injector = Injector.create(MainModule).build();

    const service: DestroyableType<Service> = injector.get(Service, Destroyable()) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);
    expect(order).toEqual([]);

    let testService, error;
    try {
      testService = injector.get(TestService);
    } catch(err) {
      error = err;
    }
    expect(testService).toEqual(undefined);
    expect(error === undefined).toEqual(false);

    await service.destroy();
    expect(order).toEqual(['Service onDestroy', 'TestService onDestroy', 'TestService injection onDestroy']);

    await service.destroy();
    expect(order).toEqual(['Service onDestroy', 'TestService onDestroy', 'TestService injection onDestroy']);
  });

  test('should work with useClass provider', async function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
      ) {}
    }

    @Module({
      providers: [
        {
          provide: 'foobar',
          useClass: Service,
          scope: Scope.TRANSIENT,
          providers: [
            TestService,
          ]
        },
      ]
    })
    class MainModule {}

    const injector = Injector.create(MainModule).build();

    const service1 = injector.get<Service>('foobar');
    expect(service1).toBeInstanceOf(Service);
    expect(service1.service).toBeInstanceOf(TestService);

    const service2 = injector.get<Service>('foobar');
    expect(service2).toBeInstanceOf(Service);
    expect(service2.service).toBeInstanceOf(TestService);

    expect(service1 === service2).toEqual(false);
    expect(service1.service === service2.service).toEqual(false);

    let testService, error;
    try {
      testService = injector.get(TestService);
    } catch(err) {
      error = err;
    }
    expect(testService).toEqual(undefined);
    expect(error === undefined).toEqual(false);
  });

  test('should work with useFactory provider', async function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
      ) {}
    }

    @Module({
      providers: [
        {
          provide: 'foobar',
          useFactory(testService: TestService) {
            return new Service(testService);
          },
          scope: Scope.TRANSIENT,
          providers: [
            TestService,
          ],
          inject: [TestService]
        },
      ]
    })
    class MainModule {}

    const injector = Injector.create(MainModule).build();

    const service1 = injector.get<Service>('foobar');
    expect(service1).toBeInstanceOf(Service);
    expect(service1.service).toBeInstanceOf(TestService);

    const service2 = injector.get<Service>('foobar');
    expect(service2).toBeInstanceOf(Service);
    expect(service2.service).toBeInstanceOf(TestService);

    expect(service1 === service2).toEqual(false);
    expect(service1.service === service2.service).toEqual(false);

    let testService, error;
    try {
      testService = injector.get(TestService);
    } catch(err) {
      error = err;
    }
    expect(testService).toEqual(undefined);
    expect(error === undefined).toEqual(false);
  });
});
