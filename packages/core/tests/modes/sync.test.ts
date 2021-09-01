import { Injector, Injectable, InjectionToken, Inject } from "../../src";

describe('Sync mode injection', function() {
  test('should works', async function() {
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
});
