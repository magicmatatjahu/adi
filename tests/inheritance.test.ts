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

    const extendedService = injector.get(ExtendedService);
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

    const extendedService = injector.get(ExtendedService);
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

    const extendedService = injector.get(ExtendedService);
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

    const extendedService = injector.get(ExtendedService);
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

    const extendedService = injector.get(ExtendedService);
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

    const extendedService = injector.get(ExtendedService);
    const service = injector.get(Service);
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
      method(service?: TestService) {
        return service;
      }
    }

    @Injectable()
    class ExtendedService extends Service {
      method() {
        return "extendedService";
      }
    }

    const injector = new Injector([
      ExtendedService,
      Service,
      TestService,
    ]);

    const extendedService = injector.get(ExtendedService);
    const service = injector.get(Service);
    expect(extendedService).toBeInstanceOf(ExtendedService);
    expect(extendedService.method()).toEqual('extendedService');
    expect(service.method()).toBeInstanceOf(TestService);
  });
});
