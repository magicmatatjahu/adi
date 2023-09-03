import { Injector, Injectable, Inject } from "@adi/core";

import { Delegation } from "../../src/hooks/delegation";
import { Delegate } from "../../src/hooks/delegate";

describe('Delegate injection hook', function () {
  test('should work', function () {
    const delegations = {
      parameter: 'delegation parameter',
      property: 'delegation property',
      argument: 'delegation argument',
    }

    @Injectable()
    class TestService {
      @Inject(Delegation('property')) readonly property: string;

      constructor(
        @Inject(Delegation('parameter')) readonly parameter: string,
      ) {}

      method(@Inject(Delegation('argument')) argument?: string) {
        return argument;
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(Delegate(delegations)) readonly testService: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ])

    const service = injector.getSync(Service)
    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService.parameter).toEqual('delegation parameter');
    expect(service.testService.property).toEqual('delegation property');
    expect(service.testService.method()).toEqual('delegation argument');
  });
});