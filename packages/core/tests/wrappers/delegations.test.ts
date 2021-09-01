import { Injector, Inject, Injectable, Delegate, Delegations } from "../../src";

describe('Delegations wrapper', function () {
  test('should works on injection based wrapper', function () {
    const delegations = {
      parameter: 'delegation parameter',
      property: 'delegation property',
      argument: 'delegation argument',
    }

    @Injectable()
    class TestService {
      @Inject(Delegate('property')) readonly property: string;

      constructor(
        @Inject(Delegate('parameter')) readonly parameter: string,
      ) {}

      method(@Inject(Delegate('argument')) argument?: string) {
        return argument;
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(Delegations(delegations)) readonly testService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService.parameter).toEqual('delegation parameter');
    expect(service.testService.property).toEqual('delegation property');
    expect(service.testService.method()).toEqual('delegation argument');
  });

  test('should works on definition based wrapper', function () {
    const delegations = {
      parameter: 'delegation parameter',
      property: 'delegation property',
      argument: 'delegation argument',
    }

    @Injectable()
    class Service {
      @Inject(Delegate('property')) readonly property: string;

      constructor(
        @Inject(Delegate('parameter')) readonly parameter: string,
      ) {}

      method(@Inject(Delegate('argument')) argument?: string) {
        return argument;
      }
    }

    const injector = new Injector([
      {
        provide: Service,
        useClass: Service,
        useWrapper: Delegations(delegations),
      }
    ]);

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.parameter).toEqual('delegation parameter');
    expect(service.property).toEqual('delegation property');
    expect(service.method()).toEqual('delegation argument');
  });
});
