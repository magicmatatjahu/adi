import { 
  Injector, Injectable, Inject, Scope, constraint, createWrapper,
  Token, Ref, Optional, Skip, Scoped, New, Self, SkipSelf, Named, Tagged, Memo, SideEffects,
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
    test('should inject tagged provider', function () {
      @Injectable()
      class TestService {}

      @Injectable()
      class Service {
        constructor(
          readonly service: TestService,
          @Inject(Tagged({ foo: 'bar' })) readonly foobar: TestService,
          @Inject(Tagged({ bar: 'foo' })) readonly barfoo: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
        {
          provide: TestService,
          useValue: 'foobar',
          when: constraint.tagged({ foo: 'bar' }),
        },
        {
          provide: TestService,
          useValue: 'barfoo',
          when: constraint.tagged({ bar: 'foo' }),
        },
      ]);

      const service = injector.get(Service) as Service;
      expect(service.service).toBeInstanceOf(TestService);
      expect((service.foobar) as any).toEqual('foobar');
      expect((service.barfoo) as any).toEqual('barfoo');
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
          @Inject(Memo(TestWrapper())) readonly service: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
      ]);

      injector.get(Service) as Service;
      injector.get(Service) as Service;
      injector.get(Service) as Service;

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

      injector.get(Service) as Service;
      injector.get(Service) as Service;
      injector.get(Service) as Service;

      expect(calls).toEqual(3);
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
});
