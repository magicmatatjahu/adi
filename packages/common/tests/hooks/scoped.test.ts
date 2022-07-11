import { Injector, Inject, Injectable, TransientScope, DefaultScope, SingletonScope } from "@adi/core";
import { Scoped } from "../../src";

describe('Scoped injection hook', function () {
  test('should inject provider using passed scope - case with TRANSIENT scope', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject([Scoped(TransientScope)]) readonly newService1: TestService,
        @Inject([Scoped(TransientScope)]) readonly newService2: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.newService1).toBeInstanceOf(TestService);
    expect(service.newService2).toBeInstanceOf(TestService);
    expect(service.service === service.newService1).toEqual(false);
    expect(service.service === service.newService2).toEqual(false);
    expect(service.newService1 === service.newService2).toEqual(false);
  });

  test('should override default scope of provider', function () {
    @Injectable({
      scope: DefaultScope,
    })
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly localService1: TestService,
        readonly localService2: TestService,
        @Inject([Scoped(TransientScope)]) readonly newService: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.localService1).toBeInstanceOf(TestService);
    expect(service.localService2).toBeInstanceOf(TestService);
    expect(service.newService).toBeInstanceOf(TestService);
    expect(service.localService1 === service.newService).toEqual(false);
    expect(service.localService2 === service.newService).toEqual(false);
    expect(service.localService1 === service.localService2).toEqual(true);
  });

  test('should not override another scope which cannot be', function () {
    @Injectable({
      scope: SingletonScope,
    })
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject([Scoped(TransientScope)]) readonly oldService: TestService,
        @Inject([Scoped(TransientScope)]) readonly probablyNewService: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.oldService).toBeInstanceOf(TestService);
    expect(service.probablyNewService).toBeInstanceOf(TestService);
    expect(service.service === service.oldService).toEqual(true);
    expect(service.service === service.probablyNewService).toEqual(true);
  });
});