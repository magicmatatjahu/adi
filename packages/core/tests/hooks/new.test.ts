import { Injectable, Inject, Injector, New } from "../../src";

describe('New injection hook', function () {
  test('should create new instances', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(New()) readonly newService1: TestService,
        @Inject(New()) readonly newService2: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ])

    const service = injector.getSync(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.newService1).toBeInstanceOf(TestService);
    expect(service.newService2).toBeInstanceOf(TestService);
    expect(service.service === service.newService1).toEqual(false);
    expect(service.service === service.newService2).toEqual(false);
    expect(service.newService1 === service.newService2).toEqual(false);
  });
});
