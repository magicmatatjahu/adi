import { ADI, Injector, Injectable, Inject, Hook, TransientScope } from "@adi/core";

import { Provides } from "../../../src/decorators/provides";
import { registryProviderPlugin } from "../../../src/plugins/registry-provider.plugin";

describe('Registry provider plugin', function () {
  const plugin = registryProviderPlugin();

  beforeAll(() => {
    ADI.use(plugin);
  });

  beforeAll(() => {
    ADI.destroy(plugin);
  });

  describe('should work with static factories', function() {
    test('simple case', function () {
      class TestService {}
  
      class RegistryProvider {
        @Provides({ provide: TestService })
        static factory() {
          return new TestService();
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          public testService: TestService,
        ) {}
      }
  
      const injector = Injector.create([
        Service,
        {
          useRegistry: RegistryProvider,
        },
      ])
  
      const service = injector.getSync(Service)
      expect(service).toBeInstanceOf(Service);
      expect(service.testService).toBeInstanceOf(TestService);
    });
  
    test('case with injections', function () {
      class TestService {
        constructor(
          readonly foobar: string,
        ) {}
      }
  
      class RegistryProvider {
        @Provides({ provide: TestService })
        static factory(@Inject('foobar') foobar: string) {
          return new TestService(foobar);
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          public testService: TestService,
        ) {}
      }
  
      const injector = Injector.create([
        Service,
        {
          provide: 'foobar',
          useValue: 'foobar',
        },
        {
          useRegistry: RegistryProvider,
        },
      ])
  
      const service = injector.getSync(Service)
      expect(service).toBeInstanceOf(Service);
      expect(service.testService).toBeInstanceOf(TestService);
      expect(service.testService.foobar).toEqual('foobar');
    });
  
    test('with hooks case', function () {
      let hookCalled = false;
  
      class TestService {
        constructor(
          readonly foobar: string,
        ) {}
      }
  
      class RegistryProvider {
        @Provides({ provide: TestService, hooks: [Hook((session, next) => { hookCalled = true; return next(session); })] })
        static factory(@Inject('foobar') foobar: string) {
          return new TestService(foobar);
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          public testService: TestService,
        ) {}
      }
  
      const injector = Injector.create([
        Service,
        {
          provide: 'foobar',
          useValue: 'foobar',
        },
        {
          useRegistry: RegistryProvider,
        },
      ])
  
      const service = injector.getSync(Service)
      expect(service).toBeInstanceOf(Service);
      expect(service.testService).toBeInstanceOf(TestService);
      expect(service.testService.foobar).toEqual('foobar');
      expect(hookCalled).toEqual(true);
    });
  
    test('reflect return type', function () {
      class TestService {
        constructor(
          readonly foobar: string,
        ) {}
      }
  
      class RegistryProvider {
        @Provides()
        static factory(@Inject('foobar') foobar: string): TestService {
          return new TestService(foobar);
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          public testService: TestService,
        ) {}
      }
  
      const injector = Injector.create([
        Service,
        {
          provide: 'foobar',
          useValue: 'foobar',
        },
        {
          useRegistry: RegistryProvider,
        },
      ])
  
      const service = injector.getSync(Service)
      expect(service).toBeInstanceOf(Service);
      expect(service.testService).toBeInstanceOf(TestService);
      expect(service.testService.foobar).toEqual('foobar');
    });

    test('should persist "this" context of collection class', function () {
      class TestService {}
  
      class RegistryProvider {
        @Provides({ provide: TestService })
        static factory() {
          return this;
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          public testService: TestService,
        ) {}
      }
  
      const injector = Injector.create([
        Service,
        {
          useRegistry: RegistryProvider,
        },
      ])
  
      const service = injector.getSync(Service)
      expect(service).toBeInstanceOf(Service);
      expect(service.testService === RegistryProvider).toEqual(true);
    });

    test('multiple factories', function () {
      class TestService1 {}
      class TestService2 {}
  
      class RegistryProvider {
        @Provides({ provide: TestService1 })
        static factory1() {
          return new TestService1();
        }

        @Provides({ provide: TestService2 })
        static factory2() {
          return new TestService2();
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          public testService1: TestService1,
          public testService2: TestService2,
        ) {}
      }
  
      const injector = Injector.create([
        Service,
        {
          useRegistry: RegistryProvider,
        },
      ])
  
      const service = injector.getSync(Service)
      expect(service).toBeInstanceOf(Service);
      expect(service.testService1).toBeInstanceOf(TestService1);
      expect(service.testService2).toBeInstanceOf(TestService2);
    });

    test('should reflect types in factories', function () {
      class TestService1 {}
      class TestService2 {}

      @Injectable()
      class Service1 {}

      @Injectable()
      class Service2 {}
  
      class RegistryProvider {
        @Provides({ provide: TestService1 })
        static factory1(service: Service1, @Inject(Service1) service2: Service2) {
          return [service, service2];
        }

        @Provides({ provide: TestService2 })
        static factory2(service: Service1, service2: Service2) {
          return [service, service2];
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          public testService1: TestService1,
          public testService2: TestService2,
        ) {}
      }
  
      const injector = Injector.create([
        Service,
        Service1,
        Service2,
        {
          useRegistry: RegistryProvider,
        },
      ])
      
      const service = injector.getSync(Service)
      expect(service).toBeInstanceOf(Service);
      expect(service.testService1).toBeInstanceOf(Array);
      expect(service.testService1[0]).toBeInstanceOf(Service1);
      expect(service.testService1[1]).toBeInstanceOf(Service1);
      expect(service.testService2).toBeInstanceOf(Array);
      expect(service.testService2[0]).toBeInstanceOf(Service1);
      expect(service.testService2[1]).toBeInstanceOf(Service2);
    });
  });

  describe('should work with prototype factories', function() {
    test('simple case', function () {
      class TestService {}
  
      @Injectable()
      class RegistryProvider {
        @Provides({ provide: TestService })
        factory() {
          return new TestService();
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          public testService: TestService,
        ) {}
      }
  
      const injector = Injector.create([
        Service,
        {
          useRegistry: RegistryProvider,
        },
      ])
  
      const service = injector.getSync(Service)
      expect(service).toBeInstanceOf(Service);
      expect(service.testService).toBeInstanceOf(TestService);
    });
  
    test('case with injections', function () {
      class TestService {
        constructor(
          readonly foobar: string,
        ) {}
      }
  
      @Injectable()
      class RegistryProvider {
        @Provides({ provide: TestService })
        static factory(@Inject('foobar') foobar: string) {
          return new TestService(foobar);
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          public testService: TestService,
        ) {}
      }
  
      const injector = Injector.create([
        Service,
        {
          provide: 'foobar',
          useValue: 'foobar',
        },
        {
          useRegistry: RegistryProvider,
        },
      ])
  
      const service = injector.getSync(Service)
      expect(service).toBeInstanceOf(Service);
      expect(service.testService).toBeInstanceOf(TestService);
      expect(service.testService.foobar).toEqual('foobar');
    });
  
    test('with hooks case', function () {
      let hookCalled = false;
  
      class TestService {
        constructor(
          readonly foobar: string,
        ) {}
      }
  
      @Injectable()
      class RegistryProvider {
        @Provides({ provide: TestService, hooks: [Hook((session, next) => { hookCalled = true; return next(session); })] })
        factory(@Inject('foobar') foobar: string) {
          return new TestService(foobar);
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          public testService: TestService,
        ) {}
      }
  
      const injector = Injector.create([
        Service,
        {
          provide: 'foobar',
          useValue: 'foobar',
        },
        {
          useRegistry: RegistryProvider,
        },
      ])
  
      const service = injector.getSync(Service)
      expect(service).toBeInstanceOf(Service);
      expect(service.testService).toBeInstanceOf(TestService);
      expect(service.testService.foobar).toEqual('foobar');
      expect(hookCalled).toEqual(true);
    });
  
    test('reflect return type', function () {
      class TestService {
        constructor(
          readonly foobar: string,
        ) {}
      }
  
      @Injectable()
      class RegistryProvider {
        @Provides()
        factory(@Inject('foobar') foobar: string): TestService {
          return new TestService(foobar);
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          public testService: TestService,
        ) {}
      }
  
      const injector = Injector.create([
        Service,
        {
          provide: 'foobar',
          useValue: 'foobar',
        },
        {
          useRegistry: RegistryProvider,
        },
      ])
  
      const service = injector.getSync(Service)
      expect(service).toBeInstanceOf(Service);
      expect(service.testService).toBeInstanceOf(TestService);
      expect(service.testService.foobar).toEqual('foobar');
    });
  
    test('should persist "this" context of collection class', function () {
      class TestService {}
  
      @Injectable()
      class RegistryProvider {
        @Provides({ provide: TestService })
        factory() {
          return this;
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          public testService: TestService,
        ) {}
      }
  
      const injector = Injector.create([
        Service,
        {
          useRegistry: RegistryProvider,
        },
      ])
  
      const service = injector.getSync(Service)
      expect(service).toBeInstanceOf(Service);
      expect(service.testService).toBeInstanceOf(RegistryProvider);
    });

    test('should persist instance of collection class (default scope case)', function () {
      class TestService {}
  
      @Injectable()
      class RegistryProvider {
        @Provides({ provide: TestService })
        factory() {
          return this;
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          public testService: TestService,
        ) {}
      }
  
      const injector = Injector.create([
        Service,
        {
          useRegistry: RegistryProvider,
        },
      ])
  
      const service1 = injector.getSync(Service)
      expect(service1).toBeInstanceOf(Service);
      expect(service1.testService).toBeInstanceOf(RegistryProvider);
      const service2 = injector.getSync(Service)
      expect(service2).toBeInstanceOf(Service);
      expect(service2.testService).toBeInstanceOf(RegistryProvider);
      expect(service1 === service2).toEqual(true);
      expect(service1.testService === service2.testService).toEqual(true);
    });

    test('should persist instance of collection class (transient scope case)', function () {
      class TestService {
        constructor(
          readonly service: any,
        ) {}
      }
  
      @Injectable()
      class RegistryProvider {
        @Provides({ provide: TestService, scope: TransientScope })
        factory() {
          return new TestService(this);
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          public testService: TestService,
        ) {}
      }
  
      const injector = Injector.create([
        Service,
        {
          useRegistry: RegistryProvider,
        },
      ])
  
      const service1 = injector.getSync(TestService);
      expect(service1).toBeInstanceOf(TestService);
      expect(service1.service).toBeInstanceOf(RegistryProvider);
      const service2 = injector.getSync(TestService);
      expect(service2).toBeInstanceOf(TestService);
      expect(service2.service).toBeInstanceOf(RegistryProvider);
      expect(service1 === service2).toEqual(false);
      expect(service1.service === service2.service).toEqual(true);
    });

    test('should create new instance of collection class in each injection (transient scope case)', function () {
      class TestService {
        constructor(
          readonly service: any,
        ) {}
      }
  
      @Injectable({
        scope: TransientScope,
      })
      class RegistryProvider {
        @Provides({ provide: TestService, scope: TransientScope })
        factory() {
          return new TestService(this);
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          public testService: TestService,
        ) {}
      }
  
      const injector = Injector.create([
        Service,
        {
          useRegistry: RegistryProvider,
        },
      ])
  
      const service1 = injector.getSync(TestService);
      expect(service1).toBeInstanceOf(TestService);
      expect(service1.service).toBeInstanceOf(RegistryProvider);
      const service2 = injector.getSync(TestService);
      expect(service2).toBeInstanceOf(TestService);
      expect(service2.service).toBeInstanceOf(RegistryProvider);
      expect(service1 === service2).toEqual(false);
      expect(service1.service === service2.service).toEqual(false);
    });

    test('multiple factories', function () {
      class TestService1 {}
      class TestService2 {}
  
      @Injectable()
      class RegistryProvider {
        @Provides({ provide: TestService1 })
        factory1() {
          return new TestService1();
        }

        @Provides({ provide: TestService2 })
        factory2() {
          return new TestService2();
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          public testService1: TestService1,
          public testService2: TestService2,
        ) {}
      }
  
      const injector = Injector.create([
        Service,
        {
          useRegistry: RegistryProvider,
        },
      ])
  
      const service = injector.getSync(Service)
      expect(service).toBeInstanceOf(Service);
      expect(service.testService1).toBeInstanceOf(TestService1);
      expect(service.testService2).toBeInstanceOf(TestService2);
    });
  });

  test('should work together - static and prototype factories', function () {
    class TestService1 {
      constructor(
        readonly service: any,
      ) {}
    }
    class TestService2 {
      constructor(
        readonly service: any,
      ) {}
    }

    @Injectable()
    class RegistryProvider {
      @Provides({ provide: TestService1 })
      static factory1() {
        return new TestService1(this);
      }

      @Provides({ provide: TestService2 })
      factory2() {
        return new TestService2(this);
      }
    }

    @Injectable()
    class Service {
      constructor(
        public testService1: TestService1,
        public testService2: TestService2,
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        useRegistry: RegistryProvider,
      },
    ])

    const service = injector.getSync(Service)
    expect(service).toBeInstanceOf(Service);
    expect(service.testService1).toBeInstanceOf(TestService1);
    expect(service.testService1.service === RegistryProvider).toEqual(true);
    expect(service.testService2).toBeInstanceOf(TestService2);
    expect(service.testService2.service).toBeInstanceOf(RegistryProvider);
  });

  test('should reflect types in factories', function () {
    class TestService1 {}
    class TestService2 {}

    @Injectable()
    class Service1 {}

    @Injectable()
    class Service2 {}

    @Injectable()
    class RegistryProvider {
      @Provides({ provide: TestService1 })
      factory1(service: Service1, @Inject(Service1) service2: Service2) {
        return [service, service2];
      }

      @Provides({ provide: TestService2 })
      factory2(service: Service1, service2: Service2) {
        return [service, service2];
      }
    }

    @Injectable()
    class Service {
      constructor(
        public testService1: TestService1,
        public testService2: TestService2,
      ) {}
    }

    const injector = Injector.create([
      Service,
      Service1,
      Service2,
      {
        useRegistry: RegistryProvider,
      },
    ])
    
    const service = injector.getSync(Service)
    expect(service).toBeInstanceOf(Service);
    expect(service.testService1).toBeInstanceOf(Array);
    expect(service.testService1[0]).toBeInstanceOf(Service1);
    expect(service.testService1[1]).toBeInstanceOf(Service1);
    expect(service.testService2).toBeInstanceOf(Array);
    expect(service.testService2[0]).toBeInstanceOf(Service1);
    expect(service.testService2[1]).toBeInstanceOf(Service2);
  });
});
