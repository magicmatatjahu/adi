import { Injector, Injectable, Inject, Optional } from "../../src";
import { unwrapPromise } from "../../src/utils";

describe('promise injection', function() {
  test('should resolve promise object', async function() {
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
        useFactory: (value: string) => {
          return new Promise(resolve => resolve(value));
        },
        inject: ['value'],
      },
      {
        provide: 'value',
        useValue: 'test value',
      },
    ])
  
    const service = await injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService.asyncProvider).toEqual('test value');
  });

  test('should resolve native promise', async function() {
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
    ])
  
    const service = await injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService.asyncProvider).toEqual('test value');
  });

  test('should return promise when value is unwrapped', async function() {
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
        useFactory: (value: string) => {
          return unwrapPromise(new Promise(resolve => resolve(value)));
        },
        inject: ['value'],
        // test logic with hook which wraps promise
        hooks: [Optional()]
      },
      {
        provide: 'value',
        useValue: 'test value',
      },
    ])
  
    const service = await injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService.asyncProvider).toBeInstanceOf(Promise);
    expect(await service.testService.asyncProvider).toEqual('test value');
  })
});
