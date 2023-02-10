import { Injector, Injectable, OnInit, OnInitHook, Inject, TransientScope } from "../../src";

import type { OnInitHookOptions } from "../../src";

describe('onInit', function() {
  test('should work', function() {
    let checkInit = false;

    @Injectable()
    class Service implements OnInit {
      onInit() {
        checkInit = true;
      }
    }

    const injector = Injector.create([
      Service,
    ]).init() as Injector;

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(checkInit).toEqual(true);
  });

  test('should call hook only one time after resolution', function() {
    let onInitCalls = 0;

    @Injectable()
    class TestService implements OnInit {
      onInit() {
        onInitCalls++;
      }
    }

    @Injectable()
    class Service {
      constructor(
        readonly testService1: TestService,
        readonly testService2: TestService,
        readonly testService3: TestService,
      ) {}
    }

    const injector =  Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(onInitCalls).toEqual(1);
  });

  test('should work as hook', function() {
    let called = false;

    const injector = Injector.create([
      {
        provide: 'foobar',
        useFactory: () => {
          return 'value from factory';
        },
        hooks: [
          OnInitHook((value: string) => {
            if (value === 'value from factory') {
              called = true
            }
          })
        ]
      }
    ]).init() as Injector;

    const foobar = injector.get('foobar');
    expect(foobar).toEqual('value from factory');
    expect(called).toEqual(true);
  });

  test('should call hook only one time after resolution - as hook', function() {
    let onInitCalls = 0;

    const injector = Injector.create([
      {
        provide: 'foobar',
        useFactory: () => {
          return 'value from factory';
        },
        hooks: [
          OnInitHook((value: string) => {
            if (value === 'value from factory') {
              onInitCalls++;
            }
          })
        ]
      }
    ]).init() as Injector;

    injector.get('foobar');
    injector.get('foobar');
    const foobar = injector.get('foobar');
    expect(foobar).toEqual('value from factory');
    expect(onInitCalls).toEqual(1);
  });

  test('should work with multiple hooks', function() {
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

    const injector = Injector.create([
      {
        provide: 'foobar',
        useFactory: () => {
          return 'value from factory';
        },
        hooks: [
          OnInitHook(hook3), 
          OnInitHook(hook2), 
          OnInitHook(hook1),
        ],
      }
    ]).init() as Injector;

    injector.get('foobar');
    injector.get('foobar');
    const foobar = injector.get('foobar');
    expect(foobar).toEqual('value from factory');
    expect(order).toEqual([1, 2, 3]);
  });

  test('should work in injection based hook', function() {
    const order: string[] = [];

    function hook(pushValue: string) {
      return function() {
        order.push(pushValue);
      }
    }

    @Injectable()
    class TestService implements OnInit {
      onInit() {
        order.push('class onInit');
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject([
          OnInitHook(hook('injection onInit'))
        ])
        readonly testService1: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(order).toEqual(['class onInit', 'injection onInit']);
  });

  test('should work alongside with all injection possibilities', function() {
    const order: string[] = [];

    function hook(pushValue: string) {
      return function() {
        order.push(pushValue);
      }
    }

    @Injectable({
      hooks: [
        OnInitHook(hook('definition onInit')),
      ]
    })
    class TestService implements OnInit {
      onInit() {
        order.push('class onInit');
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject([
          OnInitHook(hook('injection onInit'))
        ])
        readonly testService1: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: TestService,
        hooks: [
          OnInitHook(hook('provider onInit')),
        ],
      }
    ]).init() as Injector;

    // retrieve several times the `TestService` provider from injector to check if hooks are called only once
    injector.get(Service);
    injector.get(TestService);
    injector.get(TestService);
    expect(order).toEqual(["class onInit", "definition onInit", "provider onInit", "injection onInit"]);
  });

  test('should call hook always for new instances - Transient scope', function() {
    let onInitCalls = 0;

    function hook() {
      onInitCalls++;
    }

    @Injectable({
      scope: TransientScope,
      hooks: [
        OnInitHook(hook),
      ],
    })
    class TestService implements OnInit {
      onInit() {
        hook();
      }
    }

    @Injectable()
    class Service {
      constructor(
        readonly testService1: TestService,
        readonly testService2: TestService,
        readonly testService3: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(onInitCalls).toEqual(6);
  });

  test('should work in async mode', async function() {
    const order: number[] = [];

    async function hook1(value: string) {
      if (value === 'value from factory') {
        order.push(1);
      }
    }
    function hook2(value: string) {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          if (value === 'value from factory') {
            order.push(2);
          }
          resolve();
        }, 20);
      });
    }
    async function hook3(value: string) {
      if (value === 'value from factory') {
        order.push(3);
      }
    }

    const injector = Injector.create([
      {
        provide: 'foobar',
        useFactory: () => {
          return 'value from factory';
        },
        hooks: [
          OnInitHook(hook3), 
          OnInitHook(hook2), 
          OnInitHook(hook1),
        ],
      }
    ]).init() as Injector;

    await injector.get('foobar');
    await injector.get('foobar');
    const foobar = await injector.get('foobar');
    expect(foobar).toEqual('value from factory');
    expect(order).toEqual([1, 2, 3]);
  });

  test('should call hook with dependencies', function() {
    let checkInit = false;

    const hook: OnInitHookOptions = {
      onInit(value: Service, foobar: string) {
        if (foobar === 'foobar' && value instanceof Service) {
          checkInit = true;
        } 
      },
      inject: ['foobar'],
    }

    @Injectable({
      hooks: [OnInitHook(hook)],
    })
    class Service {}

    const injector = new Injector([
      Service,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]).init() as Injector;

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(checkInit).toEqual(true);
  });

  test.todo('test circular references cases');

  test.todo('test destroying instances in hooks');
});