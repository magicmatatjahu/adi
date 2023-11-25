
import { Injector, Injectable, InjectionToken } from "../../src";
import { getFromCache } from "../../src/injector/cache";

describe('cache injection', function () {
  test('should work', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        public service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ])

    const service = injector.getSync(Service)

    expect(service).toBeInstanceOf(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(getFromCache(injector, Service)).toBe(service);
    expect(injector.getSync(Service)).toBe(service);
  });

  test('should work with injection argument', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        public service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ])

    const argument = InjectionToken.argument(Service);
    const service = injector.getSync(argument)

    expect(service).toBeInstanceOf(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(getFromCache(injector, argument)).toBe(service);
    expect(getFromCache(injector, Service)).toBe(undefined);
    expect(injector.getSync(argument)).toBe(service);
  });

  test('should clear cache after provides new provider with this same token - case with type token', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        public service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ])

    const service = injector.getSync(Service)

    expect(service).toBeInstanceOf(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(getFromCache(injector, Service)).toBe(service);
    expect(injector.getSync(Service)).toBe(service);

    injector.provide({
      provide: Service,
      useValue: 'foobar',
    })
    expect(getFromCache(injector, Service)).toBe(undefined);
    expect(injector.getSync(Service)).toBe('foobar');
    expect(getFromCache(injector, Service)).toBe('foobar');
  });

  test('should clear cache after provides new provider with this same token - case with injection argument', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        public service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ])

    const argument = InjectionToken.argument(Service);
    const service = injector.getSync(argument)

    expect(service).toBeInstanceOf(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(getFromCache(injector, argument)).toBe(service);
    expect(getFromCache(injector, Service)).toBe(undefined);
    expect(injector.getSync(argument)).toBe(service);

    injector.provide({
      provide: Service,
      useValue: 'foobar',
    })

    expect(getFromCache(injector, argument)).toBe(undefined);
    expect(injector.getSync(argument)).toBe('foobar');
    expect(getFromCache(injector, argument)).toBe('foobar');
  });
});
