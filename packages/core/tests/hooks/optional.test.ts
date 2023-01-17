import { Injector, Injectable, Inject, Optional } from "../../src";

describe('Optional injection hook', function () {
  test('should handle exception when token is not defined in providers array', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject([Optional()]) readonly service: TestService
      ) {}
    }

    const injector = Injector.create([
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toEqual(undefined);
  });

  test('should handle exception when token is not defined in providers array and return default value passed as argument', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, [Optional()]) readonly service: TestService | string = 'testService',
      ) {}
    }

    const injector = Injector.create([
      Service,
    ]).init() as Injector;


    const service = injector.get(Service) as Service;
    expect(service.service).toEqual('testService');
  });

  test('should work in async resolution', async function () {
    @Injectable()
    class Service {
      constructor(
        @Inject([Optional()]) readonly service: string = 'defaultValue'
      ) {}
    }

    const injector = Injector.create([
      Service,
    ]).init() as Injector;

    const service = await injector.get(Service);
    expect(service.service).toEqual('defaultValue');
  });
});
