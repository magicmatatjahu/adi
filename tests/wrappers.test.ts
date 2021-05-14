import { 
  Injector, Injectable, Inject, Scope, constraint, c, createWrapper,
  Token, Ref, Optional, Skip, Scoped, New, Self, SkipSelf, Named, Labeled, Fallback, Multi, Memo, SideEffects, Decorate, Lazy,
} from "../src";

describe('Wrappers', function() {
  describe('Token', function() {
    test('should override inferred token', function() {
      @Injectable()
      class TestService {}

      @Injectable()
      class Service {
        constructor(
          @Inject(Token(TestService)) readonly service: String,
        ) {}
      }

  
      const injector = new Injector([
        TestService,
        Service,
      ]);
  
      const service = injector.get(Service) as Service;
      expect(service).toBeInstanceOf(Service);
      expect(service.service).toBeInstanceOf(TestService);
    });

    test('should override token passed in @Inject() decorator', function() {
      @Injectable()
      class TestService {}

      @Injectable()
      class Service {
        constructor(
          @Inject(String, Token(TestService)) readonly service: any,
        ) {}
      }

  
      const injector = new Injector([
        TestService,
        Service,
      ]);
  
      const service = injector.get(Service) as Service;
      expect(service).toBeInstanceOf(Service);
      expect(service.service).toBeInstanceOf(TestService);
    });
  });

  describe('Ref', function() {
    test('should wrap reference to function and forward it', function() {
      @Injectable()
      class ServiceA {
        constructor(
          @Inject(Ref(() => ServiceB)) readonly serviceB: ServiceB,
        ) {}
      }
  
      @Injectable()
      class ServiceB {}
  
      const injector = new Injector([
        ServiceA,
        ServiceB,
      ]);
  
      const service = injector.get(ServiceA) as ServiceA;
      expect(service).toBeInstanceOf(ServiceA);
      expect(service.serviceB).toBeInstanceOf(ServiceB);
    });

    test('should wrap reference to function and forward it (circular ref case)', function() {
      @Injectable()
      class ServiceA {
        constructor(
          @Inject(Ref(() => ServiceB)) readonly serviceB: ServiceB,
        ) {}
      }
  
      @Injectable()
      class ServiceB {
        constructor(
          @Inject(Ref(() => ServiceA)) readonly serviceA: ServiceA,
        ) {}
      }
  
      const injector = new Injector([
        ServiceA,
        ServiceB,
      ]);
  
      const service = injector.get(ServiceA) as ServiceA;
      expect(service).toBeInstanceOf(ServiceA);
      expect(service.serviceB).toBeInstanceOf(ServiceB);
      expect(service.serviceB.serviceA).toBeInstanceOf(ServiceA);
      expect(service === service.serviceB.serviceA).toEqual(true);
    });
  });

  describe('Optional', function () {
    test('should handle exception when token is not defined in providers array', function () {
      @Injectable()
      class TestService {}

      @Injectable()
      class Service {
        constructor(
          @Inject(Optional()) readonly service: TestService
        ) {}
      }
  
      const injector = new Injector([
        Service,
      ]);

      const service = injector.get(Service) as Service;
      expect(service.service).toEqual(undefined);
    });

    test('should handle exception when token is not defined in providers array and return default value passed as argument', function () {
      @Injectable()
      class TestService {}

      @Injectable()
      class Service {
        constructor(
          @Inject(Optional('testService')) readonly service: TestService
        ) {}
      }
  
      const injector = new Injector([
        Service,
      ]);

      const service = injector.get(Service) as Service;
      expect(service.service).toEqual('testService');
    });

    test('should default value overrides value passed in constructor as fallback', function () {
      @Injectable()
      class TestService {}

      @Injectable()
      class Service {
        constructor(
          @Inject(Optional('testService')) readonly service: TestService = 'defaultValue'
        ) {}
      }
  
      const injector = new Injector([
        Service,
      ]);

      const service = injector.get(Service) as Service;
      expect(service.service).toEqual('testService');
    });
  });

  describe('Skip', function () {
    test('should skip injection', function () {
      @Injectable()
      class TestService {}

      @Injectable()
      class Service {
        constructor(
          @Inject(Skip()) readonly service: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
      ]);

      const service = injector.get(Service) as Service;
      expect(service.service).toEqual(undefined);
    });
  });

  describe('Scoped', function () {
    test('should inject provider using passed scope', function () {
      @Injectable()
      class TestService {}

      @Injectable()
      class Service {
        constructor(
          readonly service: TestService,
          @Inject(Scoped(Scope.TRANSIENT)) readonly newService1: TestService,
          @Inject(Scoped(Scope.TRANSIENT)) readonly newService2: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
      ]);

      const service = injector.get(Service) as Service;
      expect(service.service).toBeInstanceOf(TestService);
      expect(service.newService1).toBeInstanceOf(TestService);
      expect(service.newService2).toBeInstanceOf(TestService);
      expect(service.service === service.newService1).toEqual(false);
      expect(service.service === service.newService2).toEqual(false);
      expect(service.newService1 === service.newService2).toEqual(false);
    });
  });

  describe('New', function () {
    test('should create new instances', function () {
      @Injectable()
      class TestService {}

      @Injectable()
      class Service {
        constructor(
          readonly service: TestService,
          @Inject(New()) readonly newService1: TestService,
          @Inject(New()) readonly newService2: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
      ]);

      const service = injector.get(Service) as Service;
      expect(service.service).toBeInstanceOf(TestService);
      expect(service.newService1).toBeInstanceOf(TestService);
      expect(service.newService2).toBeInstanceOf(TestService);
      expect(service.service === service.newService1).toEqual(false);
      expect(service.service === service.newService2).toEqual(false);
      expect(service.newService1 === service.newService2).toEqual(false);
    });
  });

  describe('Self', function () {
    test('should inject service from self injector', function () {
      @Injectable()
      class Service {
        constructor(
          @Inject('useValue', Self()) readonly useValue: string,
        ) {}
      }
  
      const parentInjector = new Injector([
        {
          provide: 'useValue',
          useValue: 'foobar',
        },
      ]);
      const childInjector = new Injector([
        Service,
        {
          provide: 'useValue',
          useValue: 'barfoo',
        },
      ], parentInjector);

      const service = childInjector.get(Service) as Service;
      expect(service.useValue).toEqual('barfoo');
    });

    test('should inject service from self injector - not found case (use Optional wrapper to handle error from NilInjector)', function () {
      @Injectable()
      class Service {
        constructor(
          @Inject('useValue', Optional(Self())) readonly useValue: string,
        ) {}
      }
  
      const parentInjector = new Injector([
        {
          provide: 'useValue',
          useValue: 'foobar',
        },
      ]);
      const childInjector = new Injector([
        Service,
      ], parentInjector);

      const service = childInjector.get(Service) as Service;
      expect(service.useValue).toEqual(undefined);
    });
  });

  describe('SkipSelf', function () {
    test('should inject service from parent injector', function () {
      @Injectable()
      class Service {
        constructor(
          @Inject('useValue', SkipSelf()) readonly useValue: string,
        ) {}
      }
  
      const parentInjector = new Injector([
        {
          provide: 'useValue',
          useValue: 'foobar',
        },
      ]);
      const childInjector = new Injector([
        Service,
        {
          provide: 'useValue',
          useValue: 'barfoo',
        },
      ], parentInjector);

      const service = childInjector.get(Service) as Service;
      expect(service.useValue).toEqual('foobar');
    });

    test('should inject service from parent injector - not found case (use Optional wrapper to handle error from NilInjector)', function () {
      @Injectable()
      class Service {
        constructor(
          @Inject('useValue', Optional(SkipSelf())) readonly useValue: string,
        ) {}
      }
  
      const parentInjector = new Injector();
      const childInjector = new Injector([
        Service,
        {
          provide: 'useValue',
          useValue: 'barfoo',
        },
      ], parentInjector);

      const service = childInjector.get(Service) as Service;
      expect(service.useValue).toEqual(undefined);
    });
  });

  describe('Named', function () {
    test('should inject named provider', function () {
      @Injectable()
      class TestService {}

      @Injectable()
      class Service {
        constructor(
          readonly service: TestService,
          @Inject(Named('namedService')) readonly namedService: TestService,
          @Inject(Named('anotherService')) readonly anotherService: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
        {
          provide: TestService,
          useValue: 'foobar',
          when: constraint.named('namedService'),
        },
        {
          provide: TestService,
          useValue: 'barfoo',
          when: constraint.named('anotherService'),
        },
      ]);

      const service = injector.get(Service) as Service;
      expect(service.service).toBeInstanceOf(TestService);
      expect((service.namedService) as any).toEqual('foobar');
      expect((service.anotherService) as any).toEqual('barfoo');
    });
  });

  describe('Tagged', function () {
    test('should inject labeled provider', function () {
      @Injectable()
      class TestService {}

      @Injectable()
      class Service {
        constructor(
          readonly service: TestService,
          @Inject(Labeled({ foo: 'bar' })) readonly foobar: TestService,
          @Inject(Labeled({ bar: 'foo' })) readonly barfoo: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
        {
          provide: TestService,
          useValue: 'foobar',
          when: constraint.labels({ foo: 'bar' }),
        },
        {
          provide: TestService,
          useValue: 'barfoo',
          when: constraint.labels({ bar: 'foo' }),
        },
      ]);

      const service = injector.get(Service) as Service;
      expect(service.service).toBeInstanceOf(TestService);
      expect((service.foobar) as any).toEqual('foobar');
      expect((service.barfoo) as any).toEqual('barfoo');
    });
  });

  describe('Fallback', function () {
    test('should inject fallback provider when given provider doesnt exist in injector', function () {
      @Injectable()
      class TestService {}

      @Injectable()
      class Service {
        constructor(
          @Inject(Fallback("token")) readonly service: TestService
        ) {}
      }
  
      const injector = new Injector([
        Service,
        {
          provide: "token",
          useValue: "foobar"
        }
      ]);

      const service = injector.get(Service) as Service;
      expect(service.service).toEqual("foobar");
    });

    test('should throw error when fallback doesnt exists', function () {
      @Injectable()
      class TestService {}

      @Injectable()
      class Service {
        constructor(
          @Inject(Fallback(String)) readonly service: TestService
        ) {}
      }
  
      const injector = new Injector([
        Service,
      ]);

      let err, service;
      try {
        service = injector.get(Service) as Service;
      } catch(e) {
        err = e;
      }

      expect(service === undefined).toEqual(true);
      expect(err !== undefined).toEqual(true);
    });
  });

  describe('Multi', function () {
    test('should inject multi providers when wrapper is defined as normal provider in providers array', function () {
      @Injectable()
      class MultiProvider extends Array<any> {}

      @Injectable()
      class Service {
        constructor(
          @Inject() readonly multi: MultiProvider,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        {
          provide: MultiProvider,
          useWrapper: Multi(),
        },
        {
          provide: MultiProvider,
          useValue: 'multi-provider-1'
        },
        {
          provide: MultiProvider,
          useValue: 'multi-provider-2'
        },
        {
          provide: MultiProvider,
          useValue: 'multi-provider-3'
        },
      ]);

      const service = injector.get(Service) as Service;
      expect(service.multi).toEqual(['multi-provider-1', 'multi-provider-2', 'multi-provider-3']);
    });

    test('should inject multi providers from given token with constraints (token based useWrapper)', function () {
      @Injectable()
      class MultiProvider extends Array<any> {}

      @Injectable()
      class Service {
        constructor(
          @Inject(Named('multi')) readonly multi: MultiProvider,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        {
          provide: MultiProvider,
          useWrapper: Multi(),
        },
        {
          provide: MultiProvider,
          useValue: 'multi1',
          when: c.named('multi'),
        },
        {
          provide: MultiProvider,
          useValue: 'multi2',
        },
        {
          provide: MultiProvider,
          useValue: 'multi3',
          when: c.named('multi'),
        }
      ]);

      const service = injector.get(Service) as Service;
      expect(service.multi).toEqual(['multi1', 'multi3']);
    });

    test('should inject multi providers from given token with constraints (injection based useWrapper)', function () {
      @Injectable()
      class Service {
        constructor(
          @Inject('token', Multi(Named('multi'))) readonly multi: Array<any>,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        {
          provide: 'token',
          useValue: 'no-multi'
        },
        {
          provide: 'token',
          useValue: 'multi1',
          when: c.named('multi'),
        },
        {
          provide: 'token',
          useValue: 'multi2',
          when: c.named('multi'),
        },
        {
          provide: 'token',
          useValue: 'multi3',
        }
      ]);

      const service = injector.get(Service) as Service;
      expect(service.multi).toEqual(['multi1', 'multi2']);
    });

    // TODO: Add more testing with side effects etc
  });

  describe('Decorate', function () {
    test('should decorate provider (injection based useWrapper) - function decorator case', function () {
      @Injectable()
      class TestService {
        method() {
          return 'foo';
        }
      }

      const functionDecorator = {
        decorator(decoratee: TestService) { return decoratee.method() + 'bar' }
      }

      @Injectable()
      class Service {
        constructor(
          @Inject(Decorate(functionDecorator)) readonly service: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
      ]);

      const service = injector.get(Service) as Service;
      expect(service.service).toEqual('foobar');
    });

    test('should decorate provider (injection based useWrapper) - function decorator case with inject array', function () {
      @Injectable()
      class AwesomeService {
        addAwesome() {
          return ' is awesome';
        }
      }

      @Injectable()
      class TestService {
        method() {
          return 'foo';
        }
      }

      const functionDecorator = {
        decorator(decoratee: TestService, service: AwesomeService, exclamation: string) { return decoratee.method() + 'bar' + service.addAwesome() + exclamation },
        inject: [AwesomeService, Token('exclamation')],
      }

      @Injectable()
      class Service {
        constructor(
          @Inject(Decorate(functionDecorator)) readonly service: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
        AwesomeService,
        {
          provide: 'exclamation',
          useValue: '!',
        }
      ]);

      const service = injector.get(Service) as Service;
      expect(service.service).toEqual('foobar is awesome!');
    });

    test('should decorate provider (injection based useWrapper) - double decorator', function () {
      @Injectable()
      class AwesomeService {
        addAwesome() {
          return ' is awesome';
        }
      }

      @Injectable()
      class TestService {
        method() {
          return 'foo';
        }
      }

      const decorator1 = {
        decorator(decoratee: TestService, service: AwesomeService) { return decoratee.method() + 'bar' + service.addAwesome() },
        inject: [AwesomeService],
      }

      const decorator2 = {
        decorator(value: string, exclamation: string) { return `(${value + exclamation})` },
        inject: ['exclamation'],
      }

      @Injectable()
      class Service {
        constructor(
          @Inject(Decorate(decorator2, Decorate(decorator1))) readonly service: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
        AwesomeService,
        {
          provide: 'exclamation',
          useValue: '!',
        }
      ]);

      const service = injector.get(Service) as Service;
      expect(service.service).toEqual('(foobar is awesome!)');
    });

    test('should decorate provider (injection based useWrapper) - class decorator case with constructor injection', function () {
      @Injectable()
      class TestService {
        method() {
          return 'foo';
        }
      }

      @Injectable()
      class DecoratorService implements TestService {
        constructor(
          @Inject('exclamation') readonly exclamation: string,
          public decoratee: TestService,
        ) {}

        method() {
          return this.decoratee.method() + 'bar' + this.exclamation;
        }
      }

      @Injectable()
      class Service {
        constructor(
          @Inject(Decorate(DecoratorService)) readonly service: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
        {
          provide: 'exclamation',
          useValue: '!',
        }
      ]);

      const service = injector.get(Service) as Service;
      expect(service.service).toBeInstanceOf(DecoratorService);
      expect((service.service as DecoratorService).decoratee).toBeInstanceOf(TestService);
      expect(service.service.method()).toEqual('foobar!');
    });

    test('should decorate provider (injection based useWrapper) - class decorator case with property injection', function () {
      @Injectable()
      class TestService {
        method() {
          return 'foo';
        }
      }

      @Injectable()
      class DecoratorService implements TestService {
        @Inject()
        public decoratee: TestService;

        constructor(
          @Inject('exclamation') readonly exclamation: string,
        ) {}

        method() {
          return this.decoratee.method() + 'bar' + this.exclamation;
        }
      }

      @Injectable()
      class Service {
        constructor(
          @Inject(Decorate(DecoratorService)) readonly service: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
        {
          provide: 'exclamation',
          useValue: '!',
        }
      ]);

      const service = injector.get(Service) as Service;
      expect(service.service).toBeInstanceOf(DecoratorService);
      expect((service.service as DecoratorService).decoratee).toBeInstanceOf(TestService);
      expect(service.service.method()).toEqual('foobar!');
    });
  });

  describe('Lazy', function () {
    test('should create lazy injection - normal injection.get(...) invocation', function () {
      @Injectable()
      class TestService {}
  
      const injector = new Injector([
        TestService,
        {
          provide: TestService,
          useWrapper: Lazy(false),
        },
      ]);

      const service = injector.get(TestService) as () => TestService;
      expect(service).toBeInstanceOf(Function);
      expect(service()).toBeInstanceOf(TestService);
    });

    test('should postpone creation - proxy case', function () {
      @Injectable()
      class LazyService {
        @Inject()
        public prop: String;
      }

      @Injectable()
      class TestService {
        @Inject(Lazy())
        public lazyService: LazyService;
      }
  
      const injector = new Injector([
        TestService,
        LazyService,
      ]);

      let err: Error;
      try {
        injector.get(TestService) as TestService;
      } catch(e) {
        err = e;
      }
      expect(err).toEqual(undefined);
    });

    test('should create proxy - proxy case', function () {
      @Injectable()
      class LazyService {
        @Inject()
        public prop: String;
      }

      @Injectable()
      class TestService {
        @Inject(Lazy())
        public lazyService: LazyService;
      }
  
      const injector = new Injector([
        TestService,
        LazyService,
        {
          provide: String,
          useValue: "foobar",
        }
      ]);

      const service = injector.get(TestService) as TestService;
      expect(service.lazyService).toBeInstanceOf(LazyService);
      expect(service.lazyService.prop).toEqual('foobar');
    });
  });

  describe('Memo', function () {
    test('should memoize injection even when injection has side effects', function () {
      let calls = 0;

      const TestWrapper = createWrapper((_: never) => {
        return (injector, session, next) => {
          const value = next(injector, session);
          session['$$sideEffects'] = true;
          calls++;
          return value;
        }
      });

      @Injectable()
      class TestService {}

      // use Transient scope to create Service on each injector.get(...)
      @Injectable({ scope: Scope.TRANSIENT })
      class Service {
        constructor(
          @Inject(Memo(TestWrapper(New()))) readonly service: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
      ]);

      const service1 = injector.get(Service) as Service;
      const service2 = injector.get(Service) as Service;
      const service3 = injector.get(Service) as Service;

      expect(service1.service).toBeInstanceOf(TestService);
      expect(service1.service).toEqual(service2.service);
      expect(service1.service).toEqual(service3.service);
      expect(calls).toEqual(1);
    });
  });

  describe('SideEffects', function () {
    test('should call wrapper chain on each injector.get(...)', function () {
      let calls = 0;

      const TestWrapper = createWrapper((_: never) => {
        return (injector, session, next) => {
          const value = next(injector, session);
          session['$$sideEffects'] = false;
          calls++;
          return value;
        }
      });

      @Injectable()
      class TestService {}

      // use Transient scope to create Service on each injector.get(...)
      @Injectable({ scope: Scope.TRANSIENT })
      class Service {
        constructor(
          @Inject(SideEffects(TestWrapper())) readonly service: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
      ]);

      const service1 = injector.get(Service) as Service;
      const service2 = injector.get(Service) as Service;
      const service3 = injector.get(Service) as Service;

      expect(service1.service).toBeInstanceOf(TestService);
      expect(service1.service).toEqual(service2.service);
      expect(service1.service).toEqual(service3.service);
      expect(calls).toEqual(3);
    });
  });

  describe('Cacheable', function () {
    test('should cache injection with simple provider (with DEFAULT scope)', function () {
      let calls = 0;

      const TestWrapper = createWrapper((_: never) => {
        return (injector, session, next) => {
          const value = next(injector, session);
          calls++;
          return value;
        }
      });

      @Injectable()
      class TestService {}

      // use Transient scope to create Service on each injector.get(...)
      @Injectable({ scope: Scope.TRANSIENT })
      class Service {
        constructor(
          @Inject(TestWrapper()) readonly service: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
      ]);

      const service1 = injector.get(Service) as Service;
      const service2 = injector.get(Service) as Service;
      const service3 = injector.get(Service) as Service;

      expect(service1.service).toBeInstanceOf(TestService);
      expect(service1.service).toEqual(service2.service);
      expect(service1.service).toEqual(service3.service);
      expect(calls).toEqual(1);
    });

    test('should not cache injection with side effects - case with New wrapper', function () {
      let calls = 0;

      const TestWrapper = createWrapper((_: never) => {
        return (injector, session, next) => {
          const value = next(injector, session);
          calls++;
          return value;
        }
      });

      @Injectable()
      class TestService {}

      // use Transient scope to create Service on each injector.get(...)
      @Injectable({ scope: Scope.TRANSIENT })
      class Service {
        constructor(
          @Inject(TestWrapper(New())) readonly service: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
      ]);

      const service1 = injector.get(Service) as Service;
      const service2 = injector.get(Service) as Service;
      const service3 = injector.get(Service) as Service;

      expect(service1.service).toBeInstanceOf(TestService);
      expect(service1.service === service2.service).toEqual(false);
      expect(service1.service === service3.service).toEqual(false);
      expect(service2.service === service3.service).toEqual(false);
      expect(calls).toEqual(3);
    });

    test('should not cache injection in different modules - case when this same provider is provided in different modules', function () {
      let calls = 0;

      const TestWrapper = createWrapper((_: never) => {
        return (injector, session, next) => {
          const value = next(injector, session);
          calls++;
          return value;
        }
      });

      @Injectable()
      class TestService {}

      // use Transient scope to create Service on each injector.get(...)
      @Injectable({ scope: Scope.TRANSIENT })
      class Service {
        constructor(
          @Inject(TestWrapper()) readonly service: TestService,
        ) {}
      }
  
      const injector1 = new Injector([
        Service,
        TestService,
      ]);
      const injector2 = new Injector([
        Service,
        TestService,
      ]);

      const service1 = injector1.get(Service) as Service;
      injector1.get(Service) as Service;
      injector1.get(Service) as Service;
      const service2 = injector2.get(Service) as Service;
      injector2.get(Service) as Service;
      injector2.get(Service) as Service;

      expect(service1.service).toBeInstanceOf(TestService);
      expect(service2.service).toBeInstanceOf(TestService);
      expect(service1.service === service2.service).toEqual(false);
      expect(calls).toEqual(2);
    });

    test('should not cache injection in different modules - case when this same provider is provided in different modules with sideEffects', function () {
      let calls = 0;

      const TestWrapper = createWrapper((_: never) => {
        return (injector, session, next) => {
          const value = next(injector, session);
          calls++;
          return value;
        }
      });

      @Injectable()
      class TestService {}

      // use Transient scope to create Service on each injector.get(...)
      @Injectable({ scope: Scope.TRANSIENT })
      class Service {
        constructor(
          @Inject(TestWrapper(New())) readonly service: TestService,
        ) {}
      }
  
      const injector1 = new Injector([
        Service,
        TestService,
      ]);
      const injector2 = new Injector([
        Service,
        TestService,
      ]);

      const service1 = injector1.get(Service) as Service;
      injector1.get(Service) as Service;
      injector1.get(Service) as Service;
      const service2 = injector2.get(Service) as Service;
      injector2.get(Service) as Service;
      injector2.get(Service) as Service;

      expect(service1.service).toBeInstanceOf(TestService);
      expect(service2.service).toBeInstanceOf(TestService);
      expect(service1.service === service2.service).toEqual(false);
      expect(calls).toEqual(6);
    });

    test('should not cache injection in different modules - case when this same provider is provided in parent injector', function () {
      let calls = 0;

      const TestWrapper = createWrapper((_: never) => {
        return (injector, session, next) => {
          const value = next(injector, session);
          calls++;
          return value;
        }
      });

      @Injectable()
      class TestService {}

      // use Transient scope to create Service on each injector.get(...)
      @Injectable({ scope: Scope.TRANSIENT })
      class Service {
        constructor(
          @Inject(TestWrapper()) readonly service: TestService,
        ) {}
      }
  
      const parentInjector = new Injector([
        Service,
        TestService,
      ]);
      const childInjector = new Injector([
        Service,
        TestService,
      ], parentInjector);

      const parentService = parentInjector.get(Service) as Service;
      parentInjector.get(Service) as Service;
      parentInjector.get(Service) as Service;
      const childService = childInjector.get(Service) as Service;
      childInjector.get(Service) as Service;
      childInjector.get(Service) as Service;

      expect(parentService.service).toBeInstanceOf(TestService);
      expect(childService.service).toBeInstanceOf(TestService);
      expect(parentService.service === childService.service).toEqual(false);
      expect(calls).toEqual(2);
    });

    test('should not cache injection in different modules - case when this same provider is provided in parent injector with sideEffects', function () {
      let calls = 0;

      const TestWrapper = createWrapper((_: never) => {
        return (injector, session, next) => {
          const value = next(injector, session);
          calls++;
          return value;
        }
      });

      @Injectable()
      class TestService {}

      // use Transient scope to create Service on each injector.get(...)
      @Injectable({ scope: Scope.TRANSIENT })
      class Service {
        constructor(
          @Inject(TestWrapper(New())) readonly service: TestService,
        ) {}
      }
  
      const parentInjector = new Injector([
        Service,
        TestService,
      ]);
      const childInjector = new Injector([
        Service,
        TestService,
      ], parentInjector);

      const parentService = parentInjector.get(Service) as Service;
      const parentService2 = parentInjector.get(Service) as Service;
      const parentService3 = parentInjector.get(Service) as Service;
      const childService = childInjector.get(Service) as Service;
      const childService2 = childInjector.get(Service) as Service;
      const childService3 = childInjector.get(Service) as Service;

      expect(parentService.service).toBeInstanceOf(TestService);
      expect(childService.service).toBeInstanceOf(TestService);
      expect(parentService.service === childService.service).toEqual(false);
      expect(parentService2.service === parentService3.service).toEqual(false);
      expect(childService2.service === childService3.service).toEqual(false);
      expect(calls).toEqual(6);
    });
  });

  test('should works in useFactory inject array', function () {
    const injector = new Injector([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
      {
        provide: 'useFactory',
        useFactory(useValue, stringArg) {
          return [useValue, stringArg];
        },
        inject: [Token('useValue'), Token(String, Optional())],
      },
    ]);

    const values = injector.get('useFactory');
    expect(values).toEqual(['foobar', undefined]);
  });

  test('testing async await', async function () {
    const promise = new Promise(resolve => resolve(true));
    // console.log(await promise);
  });
});
