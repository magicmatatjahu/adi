import { Injector, Injectable, Inject, Scoped, Scope } from "../../src";

describe('Scoped wrapper', function () {
  test('should inject provider using passed scope - case with TRANSIENT scope', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(Scoped(Scope.TRANSIENT)) readonly newService1: TestService,
        @Inject(Scoped(Scope.TRANSIENT)) readonly newService2: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.newService1).toBeInstanceOf(TestService);
    expect(service.newService2).toBeInstanceOf(TestService);
    expect(service.service === service.newService1).toEqual(false);
    expect(service.service === service.newService2).toEqual(false);
    expect(service.newService1 === service.newService2).toEqual(false);
  });
});