import { Injector, Injectable, InjectionToken, Inject } from "../src";

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
  
    const service = await injector.getAsync(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService.asyncProvider).toEqual('test value');
  });

  test('should works in async mode - deep case', async function() {
    const Token = new InjectionToken<string>();

    @Injectable()
    class DeepTestService {
      constructor(
        @Inject(Token) readonly asyncProvider: Promise<string>,
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
});
