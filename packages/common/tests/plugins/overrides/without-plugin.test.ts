import { Injector, Injectable, Inject, Token } from "@adi/core";
import { Override } from "../../../src";

describe('Without overrides plugin', function () {
  test('should not work', function () {
    const overrides = {
      parameters: [Token('parameter')],
      properties: {
        property: 'property',
      },
      methods: {
        method: [Token('argument')],
      }
    };

    @Injectable()
    class TestService {
      @Inject()
      property: string;

      constructor(
        readonly parameter: string,
      ) {}

      method(argument?: string) {
        return argument;
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(Override(overrides)) readonly testService: TestService,
      ) {}
    }

    const injector = Injector.create([
      {
        provide: 'parameter',
        useValue: 'parameter injection',
      },
      {
        provide: 'property',
        useValue: 'property injection',
      },
      {
        provide: 'argument',
        useValue: 'argument injection',
      },
      {
        provide: String,
        useValue: 'string',
      },
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService.parameter).toEqual('string');
    expect(service.testService.property).toEqual('string');
    expect(service.testService.method()).toEqual(undefined);
  });
});
