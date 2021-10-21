import { Injector, Injectable, Inject, InjectableMetadata, Scope } from "../../src";

describe('Inheritance', function() {
  test('should use parent arguments', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly parentService: TestService,
      ) {}
    }

    @Injectable()
    class ExtendedService extends Service {}

    const injector = new Injector([
      ExtendedService,
      Service,
      TestService,
    ]);

    const extendedService = injector.newGet(ExtendedService);
    expect(extendedService).toBeInstanceOf(ExtendedService);
    expect(extendedService.parentService).toBeInstanceOf(TestService);
  });

  test('should override constructor arguments', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly parentService: String,
        readonly additionalArg: Number,
      ) {}
    }

    @Injectable()
    class ExtendedService extends Service {
      constructor(
        readonly service: TestService,
      ) {
        super(undefined, undefined);
      }
    }

    const injector = new Injector([
      ExtendedService,
      Service,
      TestService,
      {
        provide: String,
        useValue: 'stringValue',
      },
      {
        provide: Number,
        useValue: 2137,
      }
    ]);

    const extendedService = injector.newGet(ExtendedService);
    expect(extendedService).toBeInstanceOf(ExtendedService);
    expect(extendedService.service).toBeInstanceOf(TestService);
    expect(extendedService.parentService).toEqual(undefined);
    expect(extendedService.additionalArg).toEqual(undefined);
  });

  test('should override parent constructor arguments with empty constructor', function() {
    @Injectable()
    class Service {
      constructor(
        readonly stringArg: String,
        readonly numberArg: Number,
      ) {}
    }

    @Injectable()
    class ExtendedService extends Service {
      constructor() {
        super(undefined, undefined);
      }
    }

    const injector = new Injector([
      ExtendedService,
      Service,
      {
        provide: String,
        useValue: 'stringValue',
      },
      {
        provide: Number,
        useValue: 2137,
      }
    ]);

    const extendedService = injector.newGet(ExtendedService);
    expect(extendedService).toBeInstanceOf(ExtendedService);
    expect(extendedService.stringArg).toEqual(undefined);
    expect(extendedService.numberArg).toEqual(undefined);
  });

  test('should override property injection', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      @Inject()
      readonly parentService: any;
    }

    @Injectable()
    class ExtendedService extends Service {
      @Inject()
      readonly parentService: TestService;
    }

    const injector = new Injector([
      ExtendedService,
      Service,
      TestService,
    ]);

    const extendedService = injector.newGet(ExtendedService);
    expect(extendedService).toBeInstanceOf(ExtendedService);
    expect(extendedService.parentService).toBeInstanceOf(TestService);
  });

  test('should override setter injection', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      prop: any;

      @Inject()
      set service(value: any) {
        this.prop = value;
      };
    }

    @Injectable()
    class ExtendedService extends Service {
      @Inject()
      set service(value: TestService) {
        this.prop = value;
      };
    }

    const injector = new Injector([
      ExtendedService,
      Service,
      TestService,
    ]);

    const extendedService = injector.newGet(ExtendedService);
    expect(extendedService).toBeInstanceOf(ExtendedService);
    expect(extendedService.prop).toBeInstanceOf(TestService);
  });

  test('should override method', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      @Inject()
      method(service?: Number) {
        return service;
      }
    }

    @Injectable()
    class ExtendedService extends Service {
      @Inject()
      method(service?: TestService) {
        return service as any;
      }
    }

    const injector = new Injector([
      ExtendedService,
      Service,
      TestService,
      {
        provide: Number,
        useValue: 2137,
      },
    ]);

    const extendedService = injector.newGet(ExtendedService);
    const service = injector.newGet(Service);
    expect(extendedService).toBeInstanceOf(ExtendedService);
    expect(extendedService.method()).toBeInstanceOf(TestService);
    expect(service.method()).toEqual(2137);
  });

  test('should override method injection to pure function after inheritance', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      @Inject()
      method(service: TestService = 'baseService') {
        return service;
      }
    }

    @Injectable()
    class ExtendedService extends Service {
      method(service: TestService = 'extendedService') {
        return service;
      }
    }

    const injector = new Injector([
      ExtendedService,
      Service,
      TestService,
    ]);

    const extendedService = injector.newGet(ExtendedService);
    const service = injector.newGet(Service);
    expect(extendedService).toBeInstanceOf(ExtendedService);
    expect(extendedService.method()).toEqual('extendedService');
    expect(service.method()).toBeInstanceOf(TestService);
  });

  test('should works with inline provider def', function() {
    class TestService {}

    class Service {
      static provider: InjectableMetadata = {
        injections: {
          parameters: [TestService],
        }
      }

      constructor(
        readonly service: TestService,
      ) {}
    }

    class ExtendedService extends Service {
      static provider: InjectableMetadata = {
        injections: {
          properties: {
            foobar: 'foobar',
          }
        }
      }

      foobar: string;
    }

    const injector = Injector.create([
      ExtendedService,
      Service,
      TestService,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]);

    const extendedService = injector.newGet(ExtendedService);
    expect(extendedService).toBeInstanceOf(ExtendedService);
    expect(extendedService.foobar).toEqual('foobar');
    expect(extendedService.service).toBeInstanceOf(TestService);
  });

  test('should works with inline provider def - base class has not constructors injections', function() {
    class TestService {}

    class Service {
      static provider: InjectableMetadata = {
        injections: {
          properties: {
            service: TestService,
          }
        }
      }

      service: TestService;
    }

    class ExtendedService extends Service {
      static provider: InjectableMetadata = {
        injections: {
          properties: {
            foobar: 'foobar',
          }
        }
      }

      foobar: string;
    }

    const injector = Injector.create([
      ExtendedService,
      Service,
      TestService,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]);

    const extendedService = injector.newGet(ExtendedService);
    expect(extendedService).toBeInstanceOf(ExtendedService);
    expect(extendedService.foobar).toEqual('foobar');
    expect(extendedService.service).toBeInstanceOf(TestService);
  });

  test('should works with inline provider def when base class is decorated by @Injectable', function() {
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
      ) {}
    }

    class ExtendedService extends Service {
      static provider: InjectableMetadata = {
        injections: {
          properties: {
            foobar: 'foobar',
          }
        }
      }

      foobar: string;
    }

    const injector = Injector.create([
      ExtendedService,
      Service,
      TestService,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]);

    const extendedService = injector.newGet(ExtendedService);
    expect(extendedService).toBeInstanceOf(ExtendedService);
    expect(extendedService.foobar).toEqual('foobar');
    expect(extendedService.service).toBeInstanceOf(TestService);
  });

  test('should works with inline provider def when extended class is decorated by @Injectable', function() {
    class TestService {}

    class Service {
      static provider: InjectableMetadata = {
        injections: {
          parameters: [TestService],
        }
      }

      constructor(
        readonly service: TestService,
      ) {}
    }

    @Injectable()
    class ExtendedService extends Service {
      @Inject('foobar')
      foobar: string;
    }

    const injector = Injector.create([
      ExtendedService,
      Service,
      TestService,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]);

    const extendedService = injector.newGet(ExtendedService);
    expect(extendedService).toBeInstanceOf(ExtendedService);
    expect(extendedService.foobar).toEqual('foobar');
    expect(extendedService.service).toBeInstanceOf(TestService);
  });

  test('should works with deep inheritance', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      @Inject()
      propertyService: TestService;

      constructor(
        readonly parentService: String,
        readonly additionalArg: Number,
      ) {}
    }

    @Injectable()
    class ExtendedService extends Service {
      constructor(
        readonly service: TestService,
      ) {
        super(undefined, undefined);
      }
    }

    @Injectable()
    class DeepExtendedService extends ExtendedService {
      @Inject()
      deepPropertyService: TestService;
    }

    const injector = new Injector([
      DeepExtendedService,
      ExtendedService,
      Service,
      TestService,
      {
        provide: String,
        useValue: 'stringValue',
      },
      {
        provide: Number,
        useValue: 2137,
      }
    ]);

    const deepExtendedService = injector.newGet(DeepExtendedService);
    expect(deepExtendedService).toBeInstanceOf(DeepExtendedService);
    expect(deepExtendedService.service).toBeInstanceOf(TestService);
    expect(deepExtendedService.parentService).toEqual(undefined);
    expect(deepExtendedService.additionalArg).toEqual(undefined);
    expect(deepExtendedService.propertyService).toBeInstanceOf(TestService);
    expect(deepExtendedService.deepPropertyService).toBeInstanceOf(TestService);
  });

  test('should works with deep inheritance when one of the base classes has not defined provider definiton', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      @Inject()
      propertyService: TestService;

      constructor(
        readonly parentService: String,
        readonly additionalArg: Number,
      ) {}
    }

    class ExtendedService extends Service {}

    @Injectable()
    class DeepExtendedService extends ExtendedService {
      @Inject()
      deepPropertyService: TestService;

      constructor(
        readonly service: TestService,
      ) {
        super(undefined, undefined);
      }
    }

    const injector = new Injector([
      DeepExtendedService,
      ExtendedService,
      Service,
      TestService,
      {
        provide: String,
        useValue: 'stringValue',
      },
      {
        provide: Number,
        useValue: 2137,
      }
    ]);

    const deepExtendedService = injector.newGet(DeepExtendedService);
    expect(deepExtendedService).toBeInstanceOf(DeepExtendedService);
    expect(deepExtendedService.service).toBeInstanceOf(TestService);
    expect(deepExtendedService.parentService).toEqual(undefined);
    expect(deepExtendedService.additionalArg).toEqual(undefined);
    expect(deepExtendedService.propertyService).toBeInstanceOf(TestService);
    expect(deepExtendedService.deepPropertyService).toBeInstanceOf(TestService);
  });

  test('should works with deep inheritance when one of the base classes has defined provider definiton only by @Inject decorator', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      @Inject()
      propertyService: TestService;

      constructor(
        readonly parentService: String,
        readonly additionalArg: Number,
      ) {}
    }

    class ExtendedService extends Service {
      @Inject()
      extendedService: TestService;
    }

    @Injectable()
    class DeepExtendedService extends ExtendedService {
      @Inject()
      deepPropertyService: TestService;

      constructor(
        readonly service: TestService,
      ) {
        super(undefined, undefined);
      }
    }

    const injector = new Injector([
      DeepExtendedService,
      ExtendedService,
      Service,
      TestService,
      {
        provide: String,
        useValue: 'stringValue',
      },
      {
        provide: Number,
        useValue: 2137,
      }
    ]);

    const deepExtendedService = injector.newGet(DeepExtendedService);
    expect(deepExtendedService).toBeInstanceOf(DeepExtendedService);
    expect(deepExtendedService.service).toBeInstanceOf(TestService);
    expect(deepExtendedService.parentService).toEqual(undefined);
    expect(deepExtendedService.additionalArg).toEqual(undefined);
    expect(deepExtendedService.deepPropertyService).toBeInstanceOf(TestService);
    expect(deepExtendedService.extendedService).toBeInstanceOf(TestService);
    expect(deepExtendedService.propertyService).toBeInstanceOf(TestService);
  });

  test('should works with deep inheritance when one of the base classes has defined inlined provider definiton', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      @Inject()
      propertyService: TestService;

      constructor(
        readonly parentService: String,
        readonly additionalArg: Number,
      ) {}
    }

    class ExtendedService extends Service {
      static provider: InjectableMetadata = {
        injections: {
          properties: {
            extendedService: TestService,
          }
        }
      }

      extendedService: TestService;
    }

    @Injectable()
    class DeepExtendedService extends ExtendedService {
      @Inject()
      deepPropertyService: TestService;

      constructor(
        readonly service: TestService,
      ) {
        super(undefined, undefined);
      }
    }

    const injector = new Injector([
      DeepExtendedService,
      ExtendedService,
      Service,
      TestService,
      {
        provide: String,
        useValue: 'stringValue',
      },
      {
        provide: Number,
        useValue: 2137,
      }
    ]);

    const deepExtendedService = injector.newGet(DeepExtendedService);
    expect(deepExtendedService).toBeInstanceOf(DeepExtendedService);
    expect(deepExtendedService.service).toBeInstanceOf(TestService);
    expect(deepExtendedService.parentService).toEqual(undefined);
    expect(deepExtendedService.additionalArg).toEqual(undefined);
    expect(deepExtendedService.deepPropertyService).toBeInstanceOf(TestService);
    expect(deepExtendedService.extendedService).toBeInstanceOf(TestService);
    expect(deepExtendedService.propertyService).toBeInstanceOf(TestService);
  });

  test('should inherite options of provider definition', function() {
    @Injectable({
      scope: Scope.TRANSIENT
    })
    class Service {}

    @Injectable()
    class ExtendedService extends Service {}

    const injector = new Injector([
      ExtendedService,
      Service,
    ]);

    const service1 = injector.newGet(ExtendedService);
    const service2 = injector.newGet(ExtendedService);
    expect(service1).toBeInstanceOf(ExtendedService);
    expect(service2).toBeInstanceOf(ExtendedService);
    expect(service1 === service2).toEqual(false);
  });

  test('should override (shallow) options of base provider definition', function() {
    @Injectable({
      scope: Scope.TRANSIENT
    })
    class Service {}

    @Injectable({
      scope: Scope.SINGLETON
    })
    class ExtendedService extends Service {}

    const injector = new Injector([
      ExtendedService,
      Service,
    ]);

    const service1 = injector.newGet(ExtendedService);
    const service2 = injector.newGet(ExtendedService);
    expect(service1).toBeInstanceOf(ExtendedService);
    expect(service2).toBeInstanceOf(ExtendedService);
    expect(service1 === service2).toEqual(true);
  });
});
