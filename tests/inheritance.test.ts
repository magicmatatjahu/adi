import { Injector, Injectable, Inject } from "../src";

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

    const service = injector.get(ExtendedService) as ExtendedService;
    expect(service).toBeInstanceOf(ExtendedService);
    expect(service.parentService).toBeInstanceOf(TestService);
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
        super(service as any, service as any);
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

    const service = injector.get(ExtendedService) as ExtendedService;
    expect(service).toBeInstanceOf(ExtendedService);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.parentService).toBeInstanceOf(TestService);
    expect(service.additionalArg).toBeInstanceOf(TestService);
    expect(service.service === service.parentService).toEqual(true);
    expect(service.service === service.additionalArg).toEqual(true);
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
        super('foobar', 34);
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

    const service = injector.get(ExtendedService) as ExtendedService;
    expect(service).toBeInstanceOf(ExtendedService);
    expect(service.stringArg).toEqual('foobar');
    expect(service.numberArg).toEqual(34);
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

    const service = injector.get(ExtendedService) as ExtendedService;
    expect(service).toBeInstanceOf(ExtendedService);
    expect(service.parentService).toBeInstanceOf(TestService);
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

    const service = injector.get(ExtendedService) as ExtendedService;
    expect(service).toBeInstanceOf(ExtendedService);
    expect(service.prop).toBeInstanceOf(TestService);
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

    const service = injector.get(ExtendedService) as ExtendedService;
    expect(service).toBeInstanceOf(ExtendedService);
    expect(service.method()).toBeInstanceOf(TestService);
  });

  test('should override method injection to pure function after inheritance', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      @Inject()
      method(service?: TestService) {
        return service;
      }
    }

    @Injectable()
    class ExtendedService extends Service {
      method() {
        return "overrided";
      }
    }

    const injector = new Injector([
      ExtendedService,
      Service,
      TestService,
    ]);

    const service = injector.get(ExtendedService) as ExtendedService;
    expect(service).toBeInstanceOf(ExtendedService);
    expect(service.method()).toEqual('overrided');
  });
});
