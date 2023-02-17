import { Injector, Injectable, Inject } from "../../src";

describe('async injection', function() {
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

  test('should return this same value', async function() {
    class Service {}

    const injector = Injector.create([
      {
        provide: Service,
        useFactory: async () => {
          return new Service();
        },
      },
    ]).init() as Injector;
  
    const service1 = injector.get(Service);
    const service2 = injector.get(Service);
    const service3 = injector.get(Service);
    const service4 = injector.get(Service);
    const service5 = injector.get(Service);

    expect(await service1 === await service2).toEqual(true);
    expect(await service2 === await service3).toEqual(true);
    expect(await service3 === await service4).toEqual(true);
    expect(await service4 === await service5).toEqual(true);
    expect(await service1).toBeInstanceOf(Service);
    expect(await service2).toBeInstanceOf(Service);
    expect(await service3).toBeInstanceOf(Service);
    expect(await service4).toBeInstanceOf(Service);
    expect(await service5).toBeInstanceOf(Service);
  });
});