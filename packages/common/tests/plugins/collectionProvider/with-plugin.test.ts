import { ADI, Injector, Injectable, Inject, Hook, TransientScope } from "@adi/core";
import { Provides, collectionProviderPlugin } from "../../../src";

describe('Collection provider plugin', function () {
  const plugin = collectionProviderPlugin();

  beforeAll(() => {
    ADI.use(plugin);
  });

  beforeAll(() => {
    ADI.destroy(plugin);
  });

  describe('should work with static factories', function() {
    test('simple case', function () {
      class TestService {}
  
      class CollectionService {
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
          useCollection: CollectionService,
        },
      ]).init() as Injector;
  
      const service = injector.get(Service) as Service;
      expect(service).toBeInstanceOf(Service);
      expect(service.testService).toBeInstanceOf(TestService);
    });
  
    test('case with injections', function () {
      class TestService {
        constructor(
          readonly foobar: string,
        ) {}
      }
  
      class CollectionService {
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
          useCollection: CollectionService,
        },
      ]).init() as Injector;
  
      const service = injector.get(Service) as Service;
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
  
      class CollectionService {
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
          useCollection: CollectionService,
        },
      ]).init() as Injector;
  
      const service = injector.get(Service) as Service;
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
  
      class CollectionService {
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
          useCollection: CollectionService,
        },
      ]).init() as Injector;
  
      const service = injector.get(Service) as Service;
      expect(service).toBeInstanceOf(Service);
      expect(service.testService).toBeInstanceOf(TestService);
      expect(service.testService.foobar).toEqual('foobar');
    });

    test('should persist "this" context of collection class', function () {
      class TestService {}
  
      class CollectionService {
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
          useCollection: CollectionService,
        },
      ]).init() as Injector;
  
      const service = injector.get(Service) as Service;
      expect(service).toBeInstanceOf(Service);
      expect(service.testService === CollectionService).toEqual(true);
    });

    test('multiple factories', function () {
      class TestService1 {}
      class TestService2 {}
  
      class CollectionService {
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
          useCollection: CollectionService,
        },
      ]).init() as Injector;
  
      const service = injector.get(Service) as Service;
      expect(service).toBeInstanceOf(Service);
      expect(service.testService1).toBeInstanceOf(TestService1);
      expect(service.testService2).toBeInstanceOf(TestService2);
    });
  });

  describe('should work with prototype factories', function() {
    test('simple case', function () {
      class TestService {}
  
      @Injectable()
      class CollectionService {
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
          useCollection: CollectionService,
        },
      ]).init() as Injector;
  
      const service = injector.get(Service) as Service;
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
      class CollectionService {
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
          useCollection: CollectionService,
        },
      ]).init() as Injector;
  
      const service = injector.get(Service) as Service;
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
      class CollectionService {
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
          useCollection: CollectionService,
        },
      ]).init() as Injector;
  
      const service = injector.get(Service) as Service;
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
      class CollectionService {
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
          useCollection: CollectionService,
        },
      ]).init() as Injector;
  
      const service = injector.get(Service) as Service;
      expect(service).toBeInstanceOf(Service);
      expect(service.testService).toBeInstanceOf(TestService);
      expect(service.testService.foobar).toEqual('foobar');
    });
  
    test('should persist "this" context of collection class', function () {
      class TestService {}
  
      @Injectable()
      class CollectionService {
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
          useCollection: CollectionService,
        },
      ]).init() as Injector;
  
      const service = injector.get(Service) as Service;
      expect(service).toBeInstanceOf(Service);
      expect(service.testService).toBeInstanceOf(CollectionService);
    });

    test('should persist instance of collection class (default scope case)', function () {
      class TestService {}
  
      @Injectable()
      class CollectionService {
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
          useCollection: CollectionService,
        },
      ]).init() as Injector;
  
      const service1 = injector.get(Service) as Service;
      expect(service1).toBeInstanceOf(Service);
      expect(service1.testService).toBeInstanceOf(CollectionService);
      const service2 = injector.get(Service) as Service;
      expect(service2).toBeInstanceOf(Service);
      expect(service2.testService).toBeInstanceOf(CollectionService);
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
      class CollectionService {
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
          useCollection: CollectionService,
        },
      ]).init() as Injector;
  
      const service1 = injector.get(TestService) as TestService;
      expect(service1).toBeInstanceOf(TestService);
      expect(service1.service).toBeInstanceOf(CollectionService);
      const service2 = injector.get(TestService) as TestService;
      expect(service2).toBeInstanceOf(TestService);
      expect(service2.service).toBeInstanceOf(CollectionService);
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
      class CollectionService {
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
          useCollection: CollectionService,
        },
      ]).init() as Injector;
  
      const service1 = injector.get(TestService) as TestService;
      expect(service1).toBeInstanceOf(TestService);
      expect(service1.service).toBeInstanceOf(CollectionService);
      const service2 = injector.get(TestService) as TestService;
      expect(service2).toBeInstanceOf(TestService);
      expect(service2.service).toBeInstanceOf(CollectionService);
      expect(service1 === service2).toEqual(false);
      expect(service1.service === service2.service).toEqual(false);
    });

    test('multiple factories', function () {
      class TestService1 {}
      class TestService2 {}
  
      @Injectable()
      class CollectionService {
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
          useCollection: CollectionService,
        },
      ]).init() as Injector;
  
      const service = injector.get(Service) as Service;
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
    class CollectionService {
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
        useCollection: CollectionService,
      },
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.testService1).toBeInstanceOf(TestService1);
    expect(service.testService1.service === CollectionService).toEqual(true);
    expect(service.testService2).toBeInstanceOf(TestService2);
    expect(service.testService2.service).toBeInstanceOf(CollectionService);
  });
});
