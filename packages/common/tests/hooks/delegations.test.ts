import { Injector, Injectable, Inject, createHook } from "@adi/core";
import { Delegate, Delegations } from "../../src";

describe('Delegations injection hook', function () {
  test('should work', function () {
    const delegations = {
      parameter: 'delegation parameter',
      property: 'delegation property',
      argument: 'delegation argument',
    }

    @Injectable()
    class TestService {
      @Inject([Delegate('property')]) readonly property: string;

      constructor(
        @Inject([Delegate('parameter')]) readonly parameter: string,
      ) {}

      method(@Inject([Delegate('argument')]) argument?: string) {
        return argument;
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject([Delegations(delegations)]) readonly testService: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService.parameter).toEqual('delegation parameter');
    expect(service.testService.property).toEqual('delegation property');
    expect(service.testService.method()).toEqual('delegation argument');
  });
});