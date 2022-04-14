import { Injector, Injectable, Inject } from "../../src";

describe('Async resolution', function() {
  test('should work', async function() {
    @Injectable()
    class TestService {
      constructor(
        @Inject('async') readonly asyncProvider: string,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly testService: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: 'async',
        useFactory: async (value: string) => {
          return value;
        },
        inject: ['value'],
      },
      {
        provide: 'value',
        useValue: 'test value',
      },
    ]).init() as Injector;
  
    const service = await injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService.asyncProvider).toEqual('test value');
  });

  test('should work with property injection', async function() {
    @Injectable()
    class DeepTestService {
      @Inject('async') readonly asyncProvider: string;
    }

    @Injectable()
    class TestService {
      @Inject() readonly deepTestService: DeepTestService;
    }

    @Injectable()
    class Service {
      @Inject() readonly testService: TestService;
    }

    const injector = Injector.create([
      Service,
      TestService,
      DeepTestService,
      {
        provide: 'async',
        useFactory: async (value: string) => {
          return value;
        },
        inject: ['value'],
      },
      {
        provide: 'value',
        useFactory: async () => 'test value',
      },
    ]).init() as Injector;
  
    const service = await injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService.deepTestService).toBeInstanceOf(DeepTestService);
    expect(service.testService.deepTestService.asyncProvider).toEqual('test value');
  });

  test('should work with deep injection graph', async function() {
    @Injectable()
    class DeepTestService {
      constructor(
        @Inject('async') readonly asyncProvider: string,
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

    const injector = Injector.create([
      Service,
      TestService,
      DeepTestService,
      {
        provide: 'async',
        useFactory: async (value: string) => {
          return value;
        },
        inject: ['value'],
      },
      {
        provide: 'value',
        useFactory: async () => 'test value',
      },
    ]).init() as Injector;
  
    const service = await injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService.deepTestService).toBeInstanceOf(DeepTestService);
    expect(service.testService.deepTestService.asyncProvider).toEqual('test value');
  });
});