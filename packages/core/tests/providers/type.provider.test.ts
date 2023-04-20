import { Injector, Injectable, Inject, injectableMixin, TransientScope, SingletonScope, Optional, Hook } from "../../src";

describe('ClassType provider (injectable provider)', function() {
  test('should work with class without constructor', function() {

    @Injectable()
    class Service {}

    const injector = Injector.create([
      Service,
    ]).init() as Injector;

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
  });

  test('should work with constructor injection', function() {
    @Injectable()
    class HelperService1 {}

    @Injectable()
    class HelperService2 {}

    @Injectable()
    class Service {
      constructor(
        readonly service1: HelperService1,
        readonly service2: HelperService2,
      ) {}
    }

    const injector = Injector.create([
      HelperService1,
      HelperService2,
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.service1).toBeInstanceOf(HelperService1);
    expect(service.service2).toBeInstanceOf(HelperService2);
  });

  test('should work with property injection', function() {
    @Injectable()
    class HelperService1 {}

    @Injectable()
    class HelperService2 {}

    @Injectable()
    class Service {
      @Inject()
      readonly service2: HelperService2;

      constructor(
        // check if constructor injection with property injection isn't broken
        readonly service1: HelperService1,
      ) {}
    }

    const injector = Injector.create([
      HelperService1,
      HelperService2,
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.service1).toBeInstanceOf(HelperService1);
    expect(service.service2).toBeInstanceOf(HelperService2);
  });

  test('should work with setter injection', function() {
    @Injectable()
    class HelperService1 {}

    @Injectable()
    class HelperService2 {}

    @Injectable()
    class Service {
      // check if property injection with setter injection isn't broken
      @Inject()
      readonly service2: HelperService1;

      public _service3: HelperService2;

      @Inject()
      set service3(value: HelperService2) { this._service3 = value; }

      constructor(
        // check if constructor injection with setter injection isn't broken
        readonly service1: HelperService1,
      ) {}
    }

    const injector = Injector.create([
      HelperService1,
      HelperService2,
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.service1).toBeInstanceOf(HelperService1);
    expect(service.service2).toBeInstanceOf(HelperService1);
    expect(service._service3).toBeInstanceOf(HelperService2);
  });

  test('should works with method injection', function() {
    @Injectable()
    class HelperService1 {}

    @Injectable()
    class HelperService2 {}

    @Injectable()
    class Service {
      // check if property injection with method injection isn't broken
      @Inject()
      readonly service2: HelperService1;

      public _service3: HelperService2;

      // check if setter injection with method injection isn't broken
      @Inject()
      set service3(value: HelperService2) { this._service3 = value; }

      constructor(
        // check if constructor injection with method injection isn't broken
        readonly service1: HelperService1,
      ) {}

      method(@Inject() svc?: HelperService1) {
        return svc;
      } 
    }

    const injector = Injector.create([
      HelperService1,
      HelperService2,
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.service1).toBeInstanceOf(HelperService1);
    expect(service.service2).toBeInstanceOf(HelperService1);
    expect(service._service3).toBeInstanceOf(HelperService2);
    expect(service.method()).toBeInstanceOf(HelperService1);
  });

  test('should work with method injection - inject all arguments', function() {
    @Injectable()
    class Service {
      method(@Inject() stringArg1?: string, @Inject() stringArg2?: string, @Inject() numberArg?: number) {
        return [stringArg1, stringArg2, numberArg];
      }
    }

    const injector = Injector.create([
      Service,
      {
        provide: String,
        useValue: 'stringArg',
      },
      {
        provide: Number,
        useValue: 2137,
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.method()).toEqual(['stringArg', 'stringArg', 2137]);
  });

  test('should work with method injection - pass argument', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      method(@Inject() service?: TestService) {
        return service;
      }
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.method()).toBeInstanceOf(TestService);
    expect(service.method('passed argument' as any)).toEqual('passed argument');
  });

  test('should work with method injection - decorator on method', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      @Inject()
      method(service?: TestService) {
        return service;
      }
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.method()).toBeInstanceOf(TestService);
    expect(service.method('passed argument' as any)).toEqual('passed argument');
  });

  test('should work with method injection - decorator on method, reuse hooks case', function() {
    @Injectable()
    class TestService1 {}

    @Injectable()
    class TestService2 {}

    @Injectable()
    class Service {
      @Inject(Optional())
      method(service1?: TestService1, service2?: TestService2) {
        return [service1, service2];
      }
    }

    const injector = Injector.create([
      Service,
      TestService1,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    const result = service.method();
    expect(result[0]).toBeInstanceOf(TestService1);
    expect(result[1]).toEqual(undefined);
    expect(service.method('passed argument 1' as any, 'passed argument 2' as any)).toEqual(['passed argument 1', 'passed argument 2']);
  });

  test('should work with method injection - decorator on method, concatenate hooks case', function() {
    let call = false;

    @Injectable()
    class TestService1 {}

    @Injectable()
    class TestService2 {}

    @Injectable()
    class Service {
      @Inject(Optional())
      method(service1?: TestService1, @Inject(Hook((session, next) => { call = true; return next(session); })) service2?: TestService2) {
        return [service1, service2];
      }
    }

    const injector = Injector.create([
      Service,
      TestService1,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    const result = service.method();
    expect(result[0]).toBeInstanceOf(TestService1);
    expect(result[1]).toEqual(undefined);
    expect(service.method('passed argument 1' as any, 'passed argument 2' as any)).toEqual(['passed argument 1', 'passed argument 2']);
    expect(call).toEqual(true);
  });

  // TODO: wait for promiseDone in pararell injections
  test('should work with method injection - async resolution', async function() {
    @Injectable({
      scope: TransientScope,
    })
    class TransientService {}

    @Injectable({
      scope: SingletonScope,
    })
    class SingletonService {}

    @Injectable()
    class Service {
      method(@Inject() singleton?: SingletonService, @Inject() transient?: TransientService, @Inject('asyncFunction') asyncFunction?: string, @Inject('asyncDeps') asyncDeps?: string) {
        return [singleton, transient, asyncFunction, asyncDeps];
      } 
    }

    const injector = Injector.create([
      TransientService,
      SingletonService,
      Service,
      {
        provide: 'asyncFunction',
        async useFactory() {
          return 'asyncFunction'
        }
      },
      {
        provide: 'asyncDeps',
        async useFactory(value: string) {
          return value === 'asyncFunction' ? 'asyncDeps' : undefined;
        },
        inject: ['asyncFunction']
      }
    ]).init() as Injector;

    const service = await injector.get(Service);
    const instances = await service.method();
    expect(instances[0]).toBeInstanceOf(SingletonService);
    expect(instances[1]).toBeInstanceOf(TransientService);
    expect(instances[2]).toEqual('asyncFunction');
    expect(instances[3]).toEqual('asyncDeps');
  });

  test('should work with method injection - preserve this context', async function() {
    @Injectable()
    class TestService1 {}

    @Injectable()
    class TestService2 {}

    @Injectable()
    class Service {
      @Inject()
      property: TestService1;

      method(@Inject() _?: TestService2) {
        return this.property;
      }
    }

    const injector = Injector.create([
      Service,
      TestService1,
      TestService2,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.method()).toBeInstanceOf(TestService1);
  });

  describe('should works as tree shakable provider', function() {
    test('when provideIn scope is this same as injector', function() {
      @Injectable({
        provideIn: 'any',
      })
      class Service {}
  
      const injector = Injector.create().init() as Injector;
  
      const service = injector.get(Service);
      expect(service).toBeInstanceOf(Service);
    });
  });

  describe('should work with injectable mixin', function() {
    test('should create injectable provider by injectable mixin', function() {
      class Service {}
      injectableMixin(Service);

      const injector = Injector.create([
        Service,
      ]).init() as Injector;
  
      const service = injector.get(Service);
      expect(service).toBeInstanceOf(Service);
    });

    test('should pass injections by injectable mixin', function() {
      @Injectable()
      class TestService {}

      class Service {
        constructor(
          public service: TestService,
        ) {}
      }
      injectableMixin(Service, undefined, {
        parameters: [TestService],
      });

      const injector = Injector.create([
        Service,
        TestService,
      ]).init() as Injector;
  
      const service = injector.get(Service) as Service;
      expect(service).toBeInstanceOf(Service);
      expect(service.service).toBeInstanceOf(TestService);
    });
  });

  describe('should works as plain provide with .provide option', function() {
    test('with simple provide', function() {
      @Injectable({
        provide: {
          useFactory() {
            return 'provide works!';
          },
        }
      })
      class Service {}
  
      const injector = Injector.create({
        providers: [Service]
      }).init() as Injector;
  
      const service = injector.get(Service);
      expect(service).toEqual('provide works!');
    });

    test('with defined provideIn', function() {
      @Injectable({
        provideIn: 'any',
        provide: {
          useFactory() {
            return 'provide works!';
          },
        }
      })
      class Service {}
  
      const injector = Injector.create().init() as Injector;
  
      const service = injector.get(Service);
      expect(service).toEqual('provide works!');
    });
  });
});
