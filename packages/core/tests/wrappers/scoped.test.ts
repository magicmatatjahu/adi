import { Injector, Injectable, Inject, NewScoped, Scope } from "../../src";

describe('Scoped wrapper', function () {
  test('should inject provider using passed scope - case with TRANSIENT scope', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(NewScoped(Scope.TRANSIENT)) readonly newService1: TestService,
        @Inject(NewScoped(Scope.TRANSIENT)) readonly newService2: TestService,
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

  test('should override default scope of provider', function () {
    @Injectable({
      scope: Scope.INSTANCE
    })
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly localService1: TestService,
        readonly localService2: TestService,
        @Inject(NewScoped(Scope.TRANSIENT)) readonly newService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.newGet(Service);
    expect(service.localService1).toBeInstanceOf(TestService);
    expect(service.localService2).toBeInstanceOf(TestService);
    expect(service.newService).toBeInstanceOf(TestService);
    expect(service.localService1 === service.newService).toEqual(false);
    expect(service.localService2 === service.newService).toEqual(false);
    expect(service.localService1 === service.localService2).toEqual(true);
  });
});