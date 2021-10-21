import { Injector, Inject, Injectable, NewDelegate, NewDelegations } from "../../src";

describe('Delegations wrapper', function () {
  test('should works on injection based wrapper', function () {
    const delegations = {
      parameter: 'delegation parameter',
      property: 'delegation property',
      argument: 'delegation argument',
    }

    @Injectable()
    class TestService {
      @Inject(NewDelegate('property')) readonly property: string;

      constructor(
        @Inject(NewDelegate('parameter')) readonly parameter: string,
      ) {}

      method(@Inject(NewDelegate('argument')) argument?: string) {
        return argument;
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(NewDelegations(delegations)) readonly testService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.newGet(Service);
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
      @Inject(NewDelegate('property')) readonly property: string;

      constructor(
        @Inject(NewDelegate('parameter')) readonly parameter: string,
      ) {}

      method(@Inject(NewDelegate('argument')) argument?: string) {
        return argument;
      }
    }

    const injector = new Injector([
      {
        provide: Service,
        useClass: Service,
        useWrapper: NewDelegations(delegations),
      }
    ]);

    const service = injector.newGet(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.parameter).toEqual('delegation parameter');
    expect(service.property).toEqual('delegation property');
    expect(service.method()).toEqual('delegation argument');
  });
});
