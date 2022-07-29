import { Injector, Injectable, Inject, Scope } from "../../src";

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

    const injector = Injector.create([
      ExtendedService,
      Service,
      TestService,
    ]).init() as Injector;

    const extendedService = injector.get(ExtendedService) as ExtendedService;
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
        super('', 0);
      }
    }

    const injector = Injector.create([
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
    ]).init() as Injector;

    const extendedService = injector.get(ExtendedService) as ExtendedService;
    expect(extendedService).toBeInstanceOf(ExtendedService);
    expect(extendedService.service).toBeInstanceOf(TestService);
    expect(extendedService.parentService).toEqual('');
    expect(extendedService.additionalArg).toEqual(0);
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
        super('', 0);
      }
    }

    const injector = Injector.create([
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
    ]).init() as Injector;

    const extendedService = injector.get(ExtendedService) as ExtendedService;
    expect(extendedService).toBeInstanceOf(ExtendedService);
    expect(extendedService.stringArg).toEqual('');
    expect(extendedService.numberArg).toEqual(0);
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

    const injector = Injector.create([
      ExtendedService,
      Service,
      TestService,
    ]).init() as Injector;

    const extendedService = injector.get(ExtendedService) as ExtendedService;
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

    const injector = Injector.create([
      ExtendedService,
      Service,
      TestService,
    ]).init() as Injector;

    const extendedService = injector.get(ExtendedService) as ExtendedService;
    expect(extendedService).toBeInstanceOf(ExtendedService);
    expect(extendedService.prop).toBeInstanceOf(TestService);
  });

  test('should override method', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      method(@Inject() service?: Number) {
        return service;
      }
    }

    @Injectable()
    class ExtendedService extends Service {
      method(@Inject() service?: TestService) {
        return service as any;
      }
    }

    const injector = Injector.create([
      ExtendedService,
      Service,
      TestService,
      {
        provide: Number,
        useValue: 2137,
      },
    ]).init() as Injector;

    const extendedService = injector.get(ExtendedService) as ExtendedService;
    const service = injector.get(Service) as Service;
    expect(extendedService).toBeInstanceOf(ExtendedService);
    expect(extendedService.method()).toBeInstanceOf(TestService);
    expect(service.method()).toEqual(2137);
  });

  test('should override method injection to pure function after inheritance', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      method(@Inject() service: TestService = 'baseService') {
        return service;
      }
    }

    @Injectable()
    class ExtendedService extends Service {
      method(service: TestService = 'extendedService') {
        return service;
      }
    }

    const injector = Injector.create([
      ExtendedService,
      Service,
      TestService,
    ]).init() as Injector;

    const extendedService = injector.get(ExtendedService) as ExtendedService;
    const service = injector.get(Service) as Service;
    expect(extendedService).toBeInstanceOf(ExtendedService);
    expect(extendedService.method()).toEqual('extendedService');
    expect(service.method()).toBeInstanceOf(TestService);
  });

  test('should work with deep inheritance', function() {
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
        super('', 0);
      }
    }

    @Injectable()
    class DeepExtendedService extends ExtendedService {
      @Inject()
      deepPropertyService: TestService;
    }

    const injector = Injector.create([
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
    ]).init() as Injector;

    const deepExtendedService = injector.get(DeepExtendedService) as DeepExtendedService;
    expect(deepExtendedService).toBeInstanceOf(DeepExtendedService);
    expect(deepExtendedService.service).toBeInstanceOf(TestService);
    expect(deepExtendedService.parentService).toEqual('');
    expect(deepExtendedService.additionalArg).toEqual(0);
    expect(deepExtendedService.propertyService).toBeInstanceOf(TestService);
    expect(deepExtendedService.deepPropertyService).toBeInstanceOf(TestService);
  });

  test('should work with deep inheritance when one of the base classes has not defined provider definiton', function() {
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
        super('', 0);
      }
    }

    const injector = Injector.create([
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
    ]).init() as Injector;

    const deepExtendedService = injector.get(DeepExtendedService) as DeepExtendedService;
    expect(deepExtendedService).toBeInstanceOf(DeepExtendedService);
    expect(deepExtendedService.service).toBeInstanceOf(TestService);
    expect(deepExtendedService.parentService).toEqual('');
    expect(deepExtendedService.additionalArg).toEqual(0);
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
        super('', 0);
      }
    }

    const injector = Injector.create([
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
    ]).init() as Injector;

    const deepExtendedService = injector.get(DeepExtendedService) as DeepExtendedService;
    expect(deepExtendedService).toBeInstanceOf(DeepExtendedService);
    expect(deepExtendedService.service).toBeInstanceOf(TestService);
    expect(deepExtendedService.parentService).toEqual('');
    expect(deepExtendedService.additionalArg).toEqual(0);
    expect(deepExtendedService.deepPropertyService).toBeInstanceOf(TestService);
    expect(deepExtendedService.extendedService).toBeInstanceOf(TestService);
    expect(deepExtendedService.propertyService).toBeInstanceOf(TestService);
  });
});
