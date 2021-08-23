import { Injector, Injectable, OnInit, OnInitHook, Inject, Scope, Delegate, StandaloneOnInit } from "../src";

describe('Hooks', function() {
  describe('onInit', function() {
    test('should works (useClass case)', function() {
      let checkInit = false;
  
      @Injectable()
      class Service implements OnInit {
        onInit() {
          checkInit = true;
        }
      }
  
      const injector = new Injector([
        Service,
      ]);
  
      const service = injector.get(Service) as Service;
      expect(service).toBeInstanceOf(Service);
      expect(checkInit).toEqual(true);
    });

    test('should call hook only one time after resolution (useClass case)', function() {
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
  
      const injector = new Injector([
        Service,
        TestService,
      ]);
  
      const service = injector.get(Service);
      expect(service).toBeInstanceOf(Service);
      expect(onInitCalls).toEqual(1);
    });

    test('should works (useWrapper case)', function() {
      let called = false;
  
      const injector = new Injector([
        {
          provide: 'foobar',
          useFactory: () => {
            return 'value from factory';
          },
          useWrapper: OnInitHook((value: string) => {
            if (value === 'value from factory') {
              called = true
            }
          })
        }
      ]);
  
      const foobar = injector.get('foobar');
      expect(foobar).toEqual('value from factory');
      expect(called).toEqual(true);
    });

    test('should call hook only one time after resolution (useWrapper case)', function() {
      let onInitCalls = 0;
  
      const injector = new Injector([
        {
          provide: 'foobar',
          useFactory: () => {
            return 'value from factory';
          },
          useWrapper: OnInitHook((value: string) => {
            if (value === 'value from factory') {
              onInitCalls++
            }
          })
        }
      ]);
  
      injector.get('foobar');
      injector.get('foobar');
      const foobar = injector.get('foobar');
      expect(foobar).toEqual('value from factory');
      expect(onInitCalls).toEqual(1);
    });

    test('should works with multiple hooks (useWrapper case)', function() {
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
          useWrapper: OnInitHook(hook3, OnInitHook(hook2, OnInitHook(hook1))),
        }
      ]);
  
      injector.get('foobar');
      injector.get('foobar');
      const foobar = injector.get('foobar');
      expect(foobar).toEqual('value from factory');
      expect(order).toEqual([1, 2, 3]);
    });
    
    test('should works in injection based useWrapper', function() {
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
          @Inject(OnInitHook(hook('injection onInit'))) readonly testService1: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
      ]);
  
      const service = injector.get(Service);
      expect(service).toBeInstanceOf(Service);
      expect(order).toEqual(['class onInit', 'injection onInit']);
    });

    test('should works alongside with all injection possibilities', function() {
      const order: string[] = [];

      function hook(pushValue: string) {
        return function() {
          order.push(pushValue);
        }
      }

      @Injectable({
        useWrapper: OnInitHook(hook('definition onInit')),
      })
      class TestService implements OnInit {
        onInit() {
          order.push('class onInit');
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          @Inject(OnInitHook(hook('injection onInit'))) readonly testService1: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
        {
          provide: TestService,
          useWrapper: OnInitHook(hook('provider onInit')),
        }
      ]);
  
      // retrieve several times the `TestService` provider from injector to check if hooks are called only once
      injector.get(Service);
      injector.get(TestService);
      injector.get(TestService);
      expect(order).toEqual(["class onInit", "definition onInit", "provider onInit", "injection onInit"]);
    });

    test('should call hook always for new instances (using Transient scope)', function() {
      let onInitCalls = 0;

      function hook() {
        onInitCalls++;
      }

      @Injectable({
        scope: Scope.TRANSIENT,
        useWrapper: OnInitHook(hook),
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
  
      const injector = new Injector([
        Service,
        TestService,
      ]);
  
      const service = injector.get(Service);
      expect(service).toBeInstanceOf(Service);
      expect(onInitCalls).toEqual(6);
    });

    test('should call hook with dependencies', function() {
      let checkInit = false;

      const hook: StandaloneOnInit = {
        onInit(foobar: string, value: Service) {
          if (foobar === 'foobar' && value instanceof Service) {
            checkInit = true;
          } 
        },
        inject: ['foobar', Delegate()]
      }

      @Injectable({
        useWrapper: OnInitHook(hook),
      })
      class Service {}
  
      const injector = new Injector([
        Service,
        {
          provide: 'foobar',
          useValue: 'foobar',
        }
      ]);
  
      const service = injector.get(Service);
      expect(service).toBeInstanceOf(Service);
      expect(checkInit).toEqual(true);
    });
  });
});
