import { Injector, Injectable, Inject, createWrapper, Value, Module, INJECTOR_SCOPE, ANNOTATIONS, createInjector, Token, StaticInjectable, Scope } from "../../src";

describe('Type provider (injectable provider)', function() {
  test('should works with class without constructor', function() {
    @Injectable()
    class Service {}

    const injector = new Injector([
      Service,
    ]);

    const service = injector.get(Service);

    expect(service).toBeInstanceOf(Service);
  });

  test('should works with constructor injection', function() {
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

    const injector = new Injector([
      HelperService1,
      HelperService2,
      Service,
    ]);

    const service = injector.get(Service);

    expect(service).toBeInstanceOf(Service);
    expect(service.service1).toBeInstanceOf(HelperService1);
    expect(service.service2).toBeInstanceOf(HelperService2);
  });

  test('should works with property injection', function() {
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

    const injector = new Injector([
      HelperService1,
      HelperService2,
      Service,
    ]);

    const service = injector.get(Service);

    expect(service).toBeInstanceOf(Service);
    expect(service.service1).toBeInstanceOf(HelperService1);
    expect(service.service2).toBeInstanceOf(HelperService2);
  });

  test('should works with setter injection', function() {
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

    const injector = new Injector([
      HelperService1,
      HelperService2,
      Service,
    ]);

    const service = injector.get(Service);

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

    const injector = new Injector([
      HelperService1,
      HelperService2,
      Service,
    ]);

    const service = injector.get(Service);

    expect(service).toBeInstanceOf(Service);
    expect(service.service1).toBeInstanceOf(HelperService1);
    expect(service.service2).toBeInstanceOf(HelperService1);
    expect(service._service3).toBeInstanceOf(HelperService2);
    expect(service.method()).toBeInstanceOf(HelperService1);
  });

  test('should works whole method injection', function() {
    @Injectable()
    class Service {
      @Inject()
      method(stringArg1?: string, stringArg2?: string, numberArg?: number) {
        return [stringArg1, stringArg2, numberArg];
      }
    }

    const injector = new Injector([
      Service,
      {
        provide: String,
        useValue: 'stringArg',
      },
      {
        provide: Number,
        useValue: 2137,
      }
    ]);

    const service = injector.get(Service);
    expect(service.method()).toEqual(['stringArg', 'stringArg', 2137]);
  });

  test('should works whole method injection with override case (using @Inject() decorator in one of arguments)', function() {
    @Injectable()
    class Service {
      @Inject()
      method(@Inject('useValue') foobar?: string, stringArg?: string, numberArg?: number) {
        return [foobar, stringArg, numberArg];
      }
    }

    const injector = new Injector([
      Service,
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
      {
        provide: String,
        useValue: 'stringArg',
      },
      {
        provide: Number,
        useValue: 2137,
      }
    ]);

    const service = injector.get(Service);
    expect(service.method()).toEqual(['foobar', 'stringArg', 2137]);
  });

  describe('should works as tree shakable provider', function() {
    test('when provideIn scope is this same as injector', function() {
      @Injectable({
        provideIn: 'any',
      })
      class Service {}
  
      const injector = new Injector();
  
      const service = injector.get(Service);
      expect(service).toBeInstanceOf(Service);
    });

    test('should works with EXPORT annotation', async () => {
      @Module({
        providers: [
          {
            provide: INJECTOR_SCOPE,
            useValue: 'child',
          }
        ]
      })
      class ChildModule {}

      @Module({
        imports: [
          ChildModule,
        ]
      })
      class ParentModule {}

      @Injectable({
        provideIn: 'child',
        annotations: {
          [ANNOTATIONS.EXPORT]: true,
        }
      })
      class Service {}

      const injector = await createInjector(ParentModule).compile();
      const service = injector.get(Service);
      expect(service).toBeInstanceOf(Service);
    });
  });
  
  describe('should works with custom providers', function() {
    test('with useValue', function() {
      @Injectable({
        useValue: "foobar",
      })
      class Service {}
  
      const injector = new Injector([
        Service,
      ]);
  
      const service = injector.get(Service);
      expect(service).toEqual('foobar');
    });

    test('with useFactory', function() {
      @Injectable({
        useFactory(foobar: string) { return foobar },
        inject: ["useValue"],
      })
      class Service {}
  
      const injector = new Injector([
        Service,
        {
          provide: "useValue",
          useValue: 'foobar',
        }
      ]);
  
      const service = injector.get(Service);
      expect(service).toEqual('foobar');
    });
  
    test('with useClass', function() {
      @Injectable()
      class TestService {}
  
      @Injectable({
        useClass: TestService,
      })
      class Service {}
  
      const injector = new Injector([
        Service,
      ]);
  
      const service = injector.get(Service);
      expect(service).toBeInstanceOf(TestService);
    });

    test('with useExisting', function() {
      @Injectable({
        useExisting: 'useValue',
      })
      class Service {}

      const injector = new Injector([
        Service,
        {
          provide: 'useValue',
          useValue: 'foobar',
        },
      ]);
  
      const service = injector.get(Service);
      expect(service).toEqual('foobar');
    });
  });

  describe('should works with inlined provider def', function() {
    test('simple `injections` property', function() {
      class HelperService1 {}
      class HelperService2 {}
  
      class Service {
        static provider = {
          injections: {
            parameters: [Token(HelperService1)],
            properties: {
              service2: HelperService1,
              service3: Token(HelperService2),
            }
          }
        }
        
        // check if property injection with setter injection isn't broken
        readonly service2: HelperService1;
  
        public _service3: HelperService2;
  
        set service3(value: HelperService2) { this._service3 = value; }
  
        constructor(
          // check if constructor injection with setter injection isn't broken
          readonly service1: HelperService1,
        ) {}
      }
  
      const injector = new Injector([
        HelperService1,
        HelperService2,
        Service,
      ]);
  
      const service = injector.get(Service);
  
      expect(service).toBeInstanceOf(Service);
      expect(service.service1).toBeInstanceOf(HelperService1);
      expect(service.service2).toBeInstanceOf(HelperService1);
      expect(service._service3).toBeInstanceOf(HelperService2);
    });

    test('simple `options` property', function() {
      class HelperService {
        static provider: StaticInjectable = {
          options: {
            scope: Scope.TRANSIENT,
          },
        }
      }
  
      class Service {
        static provider: StaticInjectable = {
          injections: {
            parameters: [Token(HelperService), HelperService],
          }
        }
  
        constructor(
          readonly service1: HelperService,
          readonly service2: HelperService,
        ) {}
      }
  
      const injector = new Injector([
        HelperService,
        Service,
      ]);
  
      const service = injector.get(Service);
  
      expect(service).toBeInstanceOf(Service);
      expect(service.service1).toBeInstanceOf(HelperService);
      expect(service.service2).toBeInstanceOf(HelperService);
      expect(service.service1 === service.service2).toEqual(false);
    });

    test('should injections and options in the `provider` field has highter priority', function() {
      class HelperService2 {}

      @Injectable({
        scope: Scope.SINGLETON,
      })
      class HelperService {
        static provider: StaticInjectable = {
          options: {
            scope: Scope.TRANSIENT,
          },
        }
      }
  
      @Injectable()
      class Service {
        static provider: StaticInjectable = {
          injections: {
            parameters: [undefined, HelperService],
          }
        }
  
        constructor(
          readonly service1: HelperService,
          readonly service2: HelperService2,
        ) {}
      }
  
      const injector = new Injector([
        HelperService,
        Service,
      ]);
  
      const service = injector.get(Service);
  
      expect(service).toBeInstanceOf(Service);
      expect(service.service1).toBeInstanceOf(HelperService);
      expect(service.service2).toBeInstanceOf(HelperService);
      expect(service.service1 === service.service2).toEqual(false);
    });
  });
});