import { Injector, Injectable, Inject, OnDestroyHook, Destroyable, Ref, TransientScope } from "../../src";
import { wait } from '../helpers';

import type { OnDestroy, DestroyableType } from '../../src';

describe('onDestroy', function() {
  test('should work in method injection', async function() {
    let destroyTimes: number = 0;

    @Injectable({
      scope: TransientScope,
    })
    class TransientService {
      onDestroy() {
        destroyTimes++;
      }
    }

    @Injectable()
    class Service {
      method(@Inject() service1?: TransientService, @Inject() service2?: TransientService) {}
    }

    const injector = new Injector([
      TransientService,
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    service.method();
    service.method();
    service.method();
    service.method();
    service.method(); // call five times method

    // wait to resolve all promises in lifecycle
    await wait();
    expect(destroyTimes).toEqual(10);
  });

  test('should work in method injection - case with deep dependencies', async function() {
    let destroyTimes: number = 0;
    let destroyOrder: string[] = [];

    @Injectable({
      scope: TransientScope,
    })
    class DeepTransientService {
      onDestroy() {
        destroyTimes++;
        destroyOrder.push('deepTransient');
      }
    }

    @Injectable({
      scope: TransientScope,
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
      method(@Inject() service?: TransientService) {}
    }

    const injector = new Injector([
      DeepTransientService,
      TransientService,
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    
    service.method();
    // wait to resolve all promises in lifecycle
    await wait();
    expect(destroyTimes).toEqual(2);
    expect(destroyOrder).toEqual([
      'transient',
      'deepTransient',
    ]);

    // call second time
    service.method();
    // wait to resolve all promises in lifecycle
    await wait();
    expect(destroyTimes).toEqual(4);
    expect(destroyOrder).toEqual([
      'transient',
      'deepTransient',
      'transient',
      'deepTransient',
    ]);

    // call third time
    service.method();
    // wait to resolve all promises in lifecycle
    await wait();
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

  test('should work as hook', async function() {
    let called = false;

    const injector = new Injector([
      {
        provide: 'foobar',
        useFactory: () => {
          return 'value from factory';
        },
        hooks: OnDestroyHook({
          onDestroy(value: string) {
            if (value === 'value from factory') {
              called = true
            }
          }
        }),
        scope: TransientScope,
      }
    ]).init() as Injector;

    const foobar = injector.get<DestroyableType<string>>('foobar', Destroyable()) as DestroyableType<string>;
    expect(foobar.value).toEqual('value from factory');
    expect(called).toEqual(false);
    
    await foobar.destroy();
    expect(called).toEqual(true);
  });

  test('should call hook only one time after destruction (injection hook case)', async function() {
    let onInitCalls = 0;

    const injector = new Injector([
      {
        provide: 'foobar',
        useFactory: () => {
          return 'value from factory';
        },
        hooks: OnDestroyHook({
          onDestroy(value: string) {
            if (value === 'value from factory') {
              onInitCalls++
            }
          }
        }),
        scope: TransientScope,
      }
    ]).init() as Injector;

    const foobar = injector.get<DestroyableType<string>>('foobar', Destroyable()) as DestroyableType<string>;
    expect(foobar.value).toEqual('value from factory');
    expect(onInitCalls).toEqual(0);
    
    await foobar.destroy();
    expect(onInitCalls).toEqual(1);

    await foobar.destroy();
    expect(onInitCalls).toEqual(1);
  });

  test('should work with multiple hooks (injection hooks case)', async function() {
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
        hooks: [
          OnDestroyHook({
            onDestroy: hook3,
          }), 
          OnDestroyHook({
            onDestroy: hook2,
          }), 
          OnDestroyHook({
            onDestroy: hook1,
          }),
        ],
        scope: TransientScope,
      }
    ]).init() as Injector;

    const foobar = injector.get<DestroyableType<string>>('foobar', Destroyable()) as DestroyableType<string>;
    expect(foobar.value).toEqual('value from factory');
    expect(order).toEqual([]);
    
    await foobar.destroy();
    expect(order).toEqual([1, 2, 3]);

    await foobar.destroy();
    expect(order).toEqual([1, 2, 3]);
  });

  test('should work in injection hook (on parameter level)', async function() {
    const order: string[] = [];

    function hook(pushValue: string) {
      return function() {
        order.push(pushValue);
      }
    }

    @Injectable({
      scope: TransientScope,
    })
    class TestService implements OnDestroy {
      onDestroy() {
        order.push('TestService onDestroy');
      }
    }

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      constructor(
        @Inject(OnDestroyHook({
          onDestroy: hook('TestService injection onDestroy'),
        })) readonly testService1: TestService,
      ) {}

      onDestroy() {
        order.push('Service onDestroy');
      }
    }

    const injector = new Injector([
      Service,
      TestService,
    ]).init() as Injector;

    const service: DestroyableType<Service> = injector.get(Service, Destroyable()) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);
    expect(order).toEqual([]);

    await service.destroy();
    expect(order).toEqual(['Service onDestroy', 'TestService onDestroy', 'TestService injection onDestroy']);

    await service.destroy();
    expect(order).toEqual(['Service onDestroy', 'TestService onDestroy', 'TestService injection onDestroy']);
  });

  test('should work alongside with all injection possibilities', async function() {
    const order: string[] = [];

    function hook(pushValue: string) {
      return function() {
        order.push(pushValue);
      }
    }

    @Injectable({
      scope: TransientScope,
      hooks: OnDestroyHook({
        onDestroy: hook('definition onDestroy'),
      }),
    })
    class TestService implements OnDestroy {
      onDestroy() {
        order.push('class onDestroy');
      }
    }

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      constructor(
        @Inject(OnDestroyHook({
          onDestroy: hook('injection onDestroy'),
        })) readonly testService1: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: TestService,
        hooks: OnDestroyHook({
          onDestroy: hook('provider onDestroy'),
        }),
      }
    ]).init() as Injector;

    const service: DestroyableType<Service> = injector.get(Service, Destroyable()) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);
    expect(order).toEqual([]);

    await service.destroy();
    expect(order).toEqual(["class onDestroy", "definition onDestroy", "provider onDestroy", "injection onDestroy"]);

    await service.destroy();
    expect(order).toEqual(["class onDestroy", "definition onDestroy", "provider onDestroy", "injection onDestroy"]);
  });

  test('should works with circular injections - simple dependency graph', async function() {
    let onDestroyOrder: string[] = [];

    @Injectable()
    class ServiceA {
      constructor(
        @Inject(Ref(() => ServiceB)) readonly serviceB: any,
      ) {}

      onDestroy() {
        onDestroyOrder.push('ServiceA');
      }
    }

    @Injectable()
    class ServiceB {
      constructor(
        @Inject(Ref(() => ServiceA)) readonly serviceA: any,
      ) {}

      onDestroy() {
        onDestroyOrder.push('ServiceB');
      }
    }

    const injector = new Injector([
      ServiceA,
      ServiceB,
    ]).init() as Injector;

    const service = injector.get(ServiceA) as ServiceA;
    expect(service).toBeInstanceOf(ServiceA);
    expect(service.serviceB).toBeInstanceOf(ServiceB);
    expect(service.serviceB.serviceA).toBeInstanceOf(ServiceA);
    expect(service === service.serviceB.serviceA).toEqual(true);

    expect(onDestroyOrder).toEqual([]);

    await injector.destroy();
    expect(onDestroyOrder).toEqual(['ServiceA', 'ServiceB']);

    await injector.destroy();
    expect(onDestroyOrder).toEqual(['ServiceA', 'ServiceB']);
  });

  test('should work with circular injections - complex dependency graph', async function() {
    let onDestroyOrder: string[] = [];

    @Injectable()
    class DeepService {
      onDestroy() {
        onDestroyOrder.push('DeepService');
      }
    }

    @Injectable()
    class ServiceA {
      constructor(
        @Inject(Ref(() => ServiceB)) readonly serviceB: any,
        readonly deepService: DeepService,
      ) {}

      onDestroy() {
        onDestroyOrder.push('ServiceA');
      }
    }

    @Injectable()
    class ServiceB {
      constructor(
        @Inject(Ref(() => ServiceA)) readonly serviceA: any,
        readonly deepService: DeepService,
      ) {}

      onDestroy() {
        onDestroyOrder.push('ServiceB');
      }
    }

    @Injectable()
    class ZeroService {
      constructor(
        readonly serviceA: ServiceA,
      ) {}

      onDestroy() {
        onDestroyOrder.push('ZeroService');
      }
    }

    const injector = new Injector([
      ZeroService,
      ServiceA,
      ServiceB,
      DeepService,
    ]).init() as Injector;

    const service = injector.get(ZeroService) as ZeroService;
    expect(service).toBeInstanceOf(ZeroService);
    expect(service.serviceA).toBeInstanceOf(ServiceA);
    expect(service.serviceA.serviceB).toBeInstanceOf(ServiceB);
    expect(service.serviceA.deepService).toBeInstanceOf(DeepService);
    expect(service.serviceA.serviceB.serviceA).toBeInstanceOf(ServiceA);
    expect(service.serviceA === service.serviceA.serviceB.serviceA).toEqual(true);

    expect(onDestroyOrder).toEqual([]);

    await injector.destroy();
    // wait to resolve all promises in lifecycle
    await wait();
    expect(onDestroyOrder).toEqual(['ZeroService', 'ServiceA', 'ServiceB', 'DeepService']);

    await injector.destroy();
    // wait to resolve all promises in lifecycle
    await wait();
    expect(onDestroyOrder).toEqual(['ZeroService', 'ServiceA', 'ServiceB', 'DeepService']);
  });
});