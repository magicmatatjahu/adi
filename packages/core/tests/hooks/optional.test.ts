import { Injector, Injectable, Inject, Optional } from "../../src";

describe('Optional injection hook', function () {
  test('should handle exception when token is not defined in providers array', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Optional()) readonly service: TestService
      ) {}
    }

    const injector = Injector.create([
      Service,
    ])

    const service = injector.getSync(Service)
    expect(service.service).toEqual(undefined);
  });

  test('should handle exception when token is not defined in providers array and return default value passed as argument (constructor argument)', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, Optional()) readonly service: TestService | string = 'testService',
      ) {}
    }

    const injector = Injector.create([
      Service,
    ])


    const service = injector.getSync(Service)
    expect(service.service).toEqual('testService');
  });

  test('should handle exception when token is not defined in providers array and return default value passed as argument (hook argument)', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, Optional('testService')) readonly service: TestService | string,
      ) {}
    }

    const injector = Injector.create([
      Service,
    ])


    const service = injector.getSync(Service)
    expect(service.service).toEqual('testService');
  });

  test('should skip injection of default value passed as argument to hook if provider exist', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, Optional('testService')) readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ])


    const service = injector.getSync(Service)
    expect(service.service).toBeInstanceOf(TestService);
  });

  test('should work in async resolution', async function () {
    @Injectable()
    class Service {
      constructor(
        @Inject(Optional()) readonly service: string = 'defaultValue'
      ) {}
    }

    const injector = Injector.create([
      Service,
    ])

    const service = await injector.get(Service);
    expect(service.service).toEqual('defaultValue');
  });
});