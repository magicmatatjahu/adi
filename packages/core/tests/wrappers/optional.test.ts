import { Injector, Injectable, Inject, NewOptional } from "../../src";

describe('Optional wrapper', function () {
  test('should handle exception when token is not defined in providers array', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(NewOptional()) readonly service: TestService
      ) {}
    }

    const injector = new Injector([
      Service,
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toEqual(undefined);
  });

  test('should handle exception when token is not defined in providers array and return default value passed as argument', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(NewOptional('testService')) readonly service: TestService
      ) {}
    }

    const injector = new Injector([
      Service,
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toEqual('testService');
  });

  test('should default value overrides value passed in constructor as fallback', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(NewOptional('testService')) readonly service: TestService = 'defaultValue'
      ) {}
    }

    const injector = new Injector([
      Service,
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toEqual('testService');
  });

  test('should works in async resolution', async function () {
    @Injectable()
    class Service {
      constructor(
        @Inject(NewOptional()) readonly service: string = 'defaultValue'
      ) {}
    }

    const injector = new Injector([
      Service,
    ]);

    const service = await injector.newGetAsync(Service);
    expect(service.service).toEqual('defaultValue');
  });
});