import { Injector, Injectable, InjectionToken, Inject, Scope } from "../src";

describe('Injection', function() {
  test('should works in sync mode', async function() {
    const Token = new InjectionToken<string>();

    @Injectable()
    class TestService {
      constructor(
        @Inject(Token) readonly asyncProvider: Promise<string>,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly testService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: Token,
        useFactory: async (value: string) => {
          return value;
        },
        inject: ['value'],
      },
      {
        provide: 'value',
        useValue: 'test value',
      },
    ]);
  
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService.asyncProvider).toBeInstanceOf(Promise);
    expect(await service.testService.asyncProvider).toEqual('test value');
  });

  test('should works in async mode', async function() {
    const Token = new InjectionToken<string>();

    @Injectable()
    class TestService {
      constructor(
        @Inject(Token) readonly asyncProvider: string,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly testService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: Token,
        useFactory: async (value: string) => {
          return value;
        },
        inject: ['value'],
      },
      {
        provide: 'value',
        useValue: 'test value',
      },
    ]);
  
    const service = await injector.getAsync(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService.asyncProvider).toEqual('test value');
  });

  test('should works in async mode - injection properties case', async function() {
    const Token = new InjectionToken<string>();

    @Injectable()
    class DeepTestService {
      @Inject(Token) readonly asyncProvider: string;
    }

    @Injectable()
    class TestService {
      @Inject() readonly deepTestService: DeepTestService;
    }

    @Injectable()
    class Service {
      @Inject() readonly testService: TestService;
    }

    const injector = new Injector([
      Service,
      TestService,
      DeepTestService,
      {
        provide: Token,
        useFactory: async (value: string) => {
          return value;
        },
        inject: ['value'],
      },
      {
        provide: 'value',
        useFactory: async () => 'test value',
      },
    ]);
  
    const service = await injector.getAsync(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService.deepTestService).toBeInstanceOf(DeepTestService);
    expect(service.testService.deepTestService.asyncProvider).toEqual('test value');
  });

  test('should works in async mode - deep case', async function() {
    const Token = new InjectionToken<string>();

    @Injectable()
    class DeepTestService {
      constructor(
        @Inject(Token) readonly asyncProvider: string,
      ) {}
    }

    @Injectable()
    class TestService {
      constructor(
        readonly deepTestService: DeepTestService,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly testService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      DeepTestService,
      {
        provide: Token,
        useFactory: async (value: string) => {
          return value;
        },
        inject: ['value'],
      },
      {
        provide: 'value',
        useFactory: async () => 'test value',
      },
    ]);
  
    const service = await injector.getAsync(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService.deepTestService).toBeInstanceOf(DeepTestService);
    expect(service.testService.deepTestService.asyncProvider).toEqual('test value');
  });

  test('should works in async mode - parallel injection case', async function() {
    class TestService {}

    @Injectable()
    class Service {
      @Inject() propTestService1: TestService;
      @Inject() propTestService2: TestService;
      @Inject() propTestService3: TestService;
      @Inject() propTestService4: TestService;
      @Inject() propTestService5: TestService;
      @Inject() propTestService6: TestService;
      @Inject() propTestService7: TestService;
      @Inject() propTestService8: TestService;
      @Inject() propTestService9: TestService;
      @Inject() propTestService10: TestService;

      constructor(
        readonly testService1: TestService,
        readonly testService2: TestService,
        readonly testService3: TestService,
        readonly testService4: TestService,
        readonly testService5: TestService,
        readonly testService6: TestService,
        readonly testService7: TestService,
        readonly testService8: TestService,
        readonly testService9: TestService,
        readonly testService10: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: TestService,
        useFactory: async () => { return Object.create(TestService.prototype) },
        scope: Scope.SINGLETON,
      }
    ]);
  
    const service = await injector.getAsync(Service);

    expect(service).toBeInstanceOf(Service);
    expect(service.testService1).toBeInstanceOf(TestService);
    expect(service.testService2).toBeInstanceOf(TestService);
    expect(service.testService3).toBeInstanceOf(TestService);
    expect(service.testService4).toBeInstanceOf(TestService);
    expect(service.testService5).toBeInstanceOf(TestService);
    expect(service.testService6).toBeInstanceOf(TestService);
    expect(service.testService7).toBeInstanceOf(TestService);
    expect(service.testService8).toBeInstanceOf(TestService);
    expect(service.testService9).toBeInstanceOf(TestService);
    expect(service.testService10).toBeInstanceOf(TestService);

    expect(service.testService1 === service.testService2).toEqual(true);
    expect(service.testService1 === service.testService3).toEqual(true);
    expect(service.testService1 === service.testService4).toEqual(true);
    expect(service.testService1 === service.testService5).toEqual(true);
    expect(service.testService1 === service.testService6).toEqual(true);
    expect(service.testService1 === service.testService7).toEqual(true);
    expect(service.testService1 === service.testService8).toEqual(true);
    expect(service.testService1 === service.testService9).toEqual(true);
    expect(service.testService1 === service.testService10).toEqual(true);

    expect(service.propTestService1).toBeInstanceOf(TestService);
    expect(service.propTestService2).toBeInstanceOf(TestService);
    expect(service.propTestService3).toBeInstanceOf(TestService);
    expect(service.propTestService4).toBeInstanceOf(TestService);
    expect(service.propTestService5).toBeInstanceOf(TestService);
    expect(service.propTestService6).toBeInstanceOf(TestService);
    expect(service.propTestService7).toBeInstanceOf(TestService);
    expect(service.propTestService8).toBeInstanceOf(TestService);
    expect(service.propTestService9).toBeInstanceOf(TestService);
    expect(service.propTestService10).toBeInstanceOf(TestService);

    expect(service.testService1 === service.propTestService1).toEqual(true);
    expect(service.testService1 === service.propTestService2).toEqual(true);
    expect(service.testService1 === service.propTestService3).toEqual(true);
    expect(service.testService1 === service.propTestService4).toEqual(true);
    expect(service.testService1 === service.propTestService5).toEqual(true);
    expect(service.testService1 === service.propTestService6).toEqual(true);
    expect(service.testService1 === service.propTestService7).toEqual(true);
    expect(service.testService1 === service.propTestService8).toEqual(true);
    expect(service.testService1 === service.propTestService9).toEqual(true);
    expect(service.testService1 === service.propTestService10).toEqual(true);
  });
});
