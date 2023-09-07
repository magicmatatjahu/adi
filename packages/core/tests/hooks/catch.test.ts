import { Injector, Injectable, Inject, Catch } from "../../src";

describe('Catch injection hook', function () {
  test('should handle exception', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Catch(_ => undefined)) readonly service: TestService
      ) {}
    }

    const injector = Injector.create([
      Service,
    ])

    const service = injector.getSync(Service)
    expect(service.service).toEqual(undefined);
  });

  test('should rethrown exception', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Catch(err => { throw err })) readonly service: TestService
      ) {}
    }

    const injector = Injector.create([
      Service,
    ])

    expect(() => injector.getSync(Service)).toThrowError()
  });
});
