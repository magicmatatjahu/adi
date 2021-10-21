import { Injector, Injectable, Inject, Scope, OnDestroyHook, Destroyable, DestroyableType, OnDestroy } from "../../src";

describe('onDestroy', function() {
  test('should works in method injection', async function() {
    let destroyTimes: number = 0;

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TransientService {
      onDestroy() {
        destroyTimes++;
      }
    }

    @Injectable()
    class Service {
      @Inject()
      method(service1?: TransientService, service2?: TransientService) {}
    }

    const injector = new Injector([
      TransientService,
      Service,
    ]);

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    service.method();
    service.method();
    service.method();
    service.method();
    service.method(); // call five times method

    // wait 100ms to resolve all promises in DestroyManager
    await new Promise(resolve => {
      setTimeout(() => {
        resolve(undefined);
      }, 100);
    });
    expect(destroyTimes).toEqual(10);
  });

  test('should works in method injection - case with deep dependencies', async function() {
    let destroyTimes: number = 0;
    let destroyOrder: string[] = [];

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class DeepTransientService {
      onDestroy() {
        destroyTimes++;
        destroyOrder.push('deepTransient');
      }
    }

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TransientService {
      constructor(
        public service: DeepTransientService,
      ) {}

      onDestroy() {
        destroyTimes++;
        destroyOrder.push('transient');
      }
    }

    @Injectable()
    class Service {
      @Inject()
      method(service?: TransientService) {}
    }

    const injector = new Injector([
      DeepTransientService,
      TransientService,
      Service,
    ]);

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    
    service.method();
    // wait 100ms to resolve all promises in DestroyManager
    await new Promise(resolve => {
      setTimeout(() => {
        resolve(undefined);
      }, 100);
    });
    expect(destroyTimes).toEqual(2);
    expect(destroyOrder).toEqual([
      'transient',
      'deepTransient',
    ]);

    // call second time
    service.method();
    // wait 100ms to resolve all promises in DestroyManager
    await new Promise(resolve => {
      setTimeout(() => {
        resolve(undefined);
      }, 100);
    });
    expect(destroyTimes).toEqual(4);
    expect(destroyOrder).toEqual([
      'transient',
      'deepTransient',
      'transient',
      'deepTransient',
    ]);

    // call third time
    service.method();
    // wait 100ms to resolve all promises in DestroyManager
    await new Promise(resolve => {
      setTimeout(() => {
        resolve(undefined);
      }, 100);
    });
    expect(destroyTimes).toEqual(6);
    expect(destroyOrder).toEqual([
      'transient',
      'deepTransient',
      'transient',
      'deepTransient',
      'transient',
      'deepTransient',
    ]);
  });

  test('should works as wrapper', async function() {
    let called = false;

    const injector = new Injector([
      {
        provide: 'foobar',
        useFactory: () => {
          return 'value from factory';
        },
        useWrapper: OnDestroyHook((value: string) => {
          if (value === 'value from factory') {
            called = true
          }
        }),
        scope: Scope.TRANSIENT,
      }
    ]);

    const foobar = injector.get<DestroyableType<string>>('foobar', Destroyable());
    expect(foobar.value).toEqual('value from factory');
    expect(called).toEqual(false);
    
    await foobar.destroy();
    expect(called).toEqual(true);
  });

  test('should call hook only one time after destruction (useWrapper case)', async function() {
    let onInitCalls = 0;

    const injector = new Injector([
      {
        provide: 'foobar',
        useFactory: () => {
          return 'value from factory';
        },
        useWrapper: OnDestroyHook((value: string) => {
          if (value === 'value from factory') {
            onInitCalls++
          }
        }),
        scope: Scope.TRANSIENT,
      }
    ]);

    const foobar = injector.get<DestroyableType<string>>('foobar', Destroyable());
    expect(foobar.value).toEqual('value from factory');
    expect(onInitCalls).toEqual(0);
    
    await foobar.destroy();
    expect(onInitCalls).toEqual(1);

    await foobar.destroy();
    expect(onInitCalls).toEqual(1);
  });

  test('should works with multiple hooks (useWrapper case)', async function() {
    const order: number[] = [];

    function hook1(value: string) {
      if (value === 'value from factory') {
        order.push(1);
      }
    }
    function hook2(value: string) {
      if (value === 'value from factory') {
        order.push(2);
      }
    }
    function hook3(value: string) {
      if (value === 'value from factory') {
        order.push(3);
      }
    }

    const injector = new Injector([
      {
        provide: 'foobar',
        useFactory: () => {
          return 'value from factory';
        },
        useWrapper: [
          OnDestroyHook(hook3), 
          OnDestroyHook(hook2), 
          OnDestroyHook(hook1),
        ],
        scope: Scope.TRANSIENT,
      }
    ]);

    const foobar = injector.get<DestroyableType<string>>('foobar', Destroyable());
    expect(foobar.value).toEqual('value from factory');
    expect(order).toEqual([]);
    
    await foobar.destroy();
    expect(order).toEqual([1, 2, 3]);

    await foobar.destroy();
    expect(order).toEqual([1, 2, 3]);
  });

  test('should works in injection based useWrapper', async function() {
    const order: string[] = [];

    function hook(pushValue: string) {
      return function() {
        order.push(pushValue);
      }
    }

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TestService implements OnDestroy {
      onDestroy() {
        order.push('class onDestroy');
      }
    }

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class Service {
      constructor(
        @Inject(OnDestroyHook(hook('injection onDestroy'))) readonly testService1: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service: DestroyableType<Service> = injector.get(Service, Destroyable()) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);
    expect(order).toEqual([]);

    await service.destroy();
    expect(order).toEqual(['class onDestroy', 'injection onDestroy']);

    await service.destroy();
    expect(order).toEqual(['class onDestroy', 'injection onDestroy']);
  });

  test('should works alongside with all injection possibilities', async function() {
    const order: string[] = [];

    function hook(pushValue: string) {
      return function() {
        order.push(pushValue);
      }
    }

    @Injectable({
      scope: Scope.TRANSIENT,
      useWrapper: OnDestroyHook(hook('definition onDestroy')),
    })
    class TestService implements OnDestroy {
      onDestroy() {
        order.push('class onDestroy');
      }
    }

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class Service {
      constructor(
        @Inject(OnDestroyHook(hook('injection onDestroy'))) readonly testService1: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: TestService,
        useWrapper: OnDestroyHook(hook('provider onDestroy')),
      }
    ]);

    const service: DestroyableType<Service> = injector.get(Service, Destroyable()) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);
    expect(order).toEqual([]);

    await service.destroy();
    expect(order).toEqual(["class onDestroy", "definition onDestroy", "provider onDestroy", "injection onDestroy"]);

    await service.destroy();
    expect(order).toEqual(["class onDestroy", "definition onDestroy", "provider onDestroy", "injection onDestroy"]);
  });
});
