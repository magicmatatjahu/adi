import { Injector, Injectable, Inject, NewNew } from "../../src";

describe('New wrapper', function () {
  test('should create new instances', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(NewNew()) readonly newService1: TestService,
        @Inject(NewNew()) readonly newService2: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.newService1).toBeInstanceOf(TestService);
    expect(service.newService2).toBeInstanceOf(TestService);
    expect(service.service === service.newService1).toEqual(false);
    expect(service.service === service.newService2).toEqual(false);
    expect(service.newService1 === service.newService2).toEqual(false);
  });
});