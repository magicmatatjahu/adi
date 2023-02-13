import { ADI, Injector, Injectable, Inject, TransientScope, createHook, New } from "@adi/core";
import { cachePlugin } from "../../../src";

describe('Cache plugin', function () {
  const plugin = cachePlugin();

  beforeAll(() => {
    ADI.use(plugin);
  });

  beforeAll(() => {
    ADI.destroy(plugin);
  });

  test('should cache injection with simple provider (with default scope)', function () {
    let calls = 0;

    const TestHook = createHook(() => {
      return (session, next) => {
        const value = next(session);
        calls++;
        return value;
      }
    });

    @Injectable()
    class TestService {}

    // use Transient scope to create Service on each injector.get(...)
    @Injectable({ scope: TransientScope })
    class Service {
      constructor(
        @Inject(TestHook()) readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service1 = injector.get(Service) as Service;
    const service2 = injector.get(Service) as Service;
    const service3 = injector.get(Service) as Service;

    expect(service1.service).toBeInstanceOf(TestService);
    expect(service1.service).toEqual(service2.service);
    expect(service1.service).toEqual(service3.service);
    expect(calls).toEqual(1);
  });

  test('should not cache injection with side effects - case with New wrapper', function () {
    let calls = 0;

    const TestWrapper = createHook(() => {
      return (session, next) => {
        const value = next(session);
        calls++;
        return value;
      }
    });

    @Injectable()
    class TestService {}

    // use Transient scope to create Service on each injector.get(...)
    @Injectable({ scope: TransientScope })
    class Service {
      constructor(
        @Inject([
          TestWrapper(),
          New(),
        ]) 
        readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service1 = injector.get(Service) as Service;
    const service2 = injector.get(Service) as Service;
    const service3 = injector.get(Service) as Service;

    expect(service1.service).toBeInstanceOf(TestService);
    expect(service1.service === service2.service).toEqual(false);
    expect(service1.service === service3.service).toEqual(false);
    expect(service2.service === service3.service).toEqual(false);
    expect(calls).toEqual(3);
  });

  test('should not cache injection in different modules - case when this same provider is provided in different modules', function () {
    let calls = 0;

    const TestWrapper = createHook(() => {
      return (session, next) => {
        const value = next(session);
        calls++;
        return value;
      }
    });

    @Injectable()
    class TestService {}

    // use Transient scope to create Service on each injector.get(...)
    @Injectable({ scope: TransientScope })
    class Service {
      constructor(
        @Inject(TestWrapper()) readonly service: TestService,
      ) {}
    }

    const injector1 = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;
    const injector2 = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service1 = injector1.get(Service) as Service;
    injector1.get(Service);
    injector1.get(Service);
    const service2 = injector2.get(Service) as Service;
    injector2.get(Service);
    injector2.get(Service);

    expect(service1.service).toBeInstanceOf(TestService);
    expect(service2.service).toBeInstanceOf(TestService);
    expect(service1.service === service2.service).toEqual(false);
    expect(calls).toEqual(2);
  });

  test('should not cache injection in different modules - case when this same provider is provided in different modules with sideEffects', function () {
    let calls = 0;

    const TestWrapper = createHook(() => {
      return (session, next) => {
        const value = next(session);
        calls++;
        return value;
      }
    });

    @Injectable()
    class TestService {}

    // use Transient scope to create Service on each injector.get(...)
    @Injectable({ scope: TransientScope })
    class Service {
      constructor(
        @Inject([
          TestWrapper(),
          New(),
        ])
        readonly service: TestService,
      ) {}
    }

    const injector1 = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;
    const injector2 = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service1 = injector1.get(Service) as Service;
    injector1.get(Service);
    injector1.get(Service);
    const service2 = injector2.get(Service) as Service;
    injector2.get(Service);
    injector2.get(Service);

    expect(service1.service).toBeInstanceOf(TestService);
    expect(service2.service).toBeInstanceOf(TestService);
    expect(service1.service === service2.service).toEqual(false);
    expect(calls).toEqual(6);
  });

  test('should not cache injection in different modules - case when this same provider is provided in parent injector', function () {
    let calls = 0;

    const TestWrapper = createHook(() => {
      return (session, next) => {
        const value = next(session);
        calls++;
        return value;
      }
    });

    @Injectable()
    class TestService {}

    // use Transient scope to create Service on each injector.get(...)
    @Injectable({ scope: TransientScope })
    class Service {
      constructor(
        @Inject(TestWrapper()) readonly service: TestService,
      ) {}
    }

    const parentInjector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;
    const childInjector = Injector.create([
      Service,
      TestService,
    ], undefined, parentInjector).init() as Injector;

    const parentService = parentInjector.get(Service) as Service;
    parentInjector.get(Service);
    parentInjector.get(Service);
    const childService = childInjector.get(Service) as Service;
    childInjector.get(Service);
    childInjector.get(Service);

    expect(parentService.service).toBeInstanceOf(TestService);
    expect(childService.service).toBeInstanceOf(TestService);
    expect(parentService.service === childService.service).toEqual(false);
    expect(calls).toEqual(2);
  });

  test('should not cache injection in different modules - case when this same provider is provided in parent injector with sideEffects', function () {
    let calls = 0;

    const TestWrapper = createHook(() => {
      return (session, next) => {
        const value = next(session);
        calls++;
        return value;
      }
    });

    @Injectable()
    class TestService {}

    // use Transient scope to create Service on each injector.get(...)
    @Injectable({ scope: TransientScope })
    class Service {
      constructor(
        @Inject([
          TestWrapper(),
          New(),
        ])
        readonly service: TestService,
      ) {}
    }

    const parentInjector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;
    const childInjector = Injector.create([
      Service,
      TestService,
    ], undefined, parentInjector).init() as Injector;

    const parentService = parentInjector.get(Service) as Service;
    const parentService2 = parentInjector.get(Service) as Service;
    const parentService3 = parentInjector.get(Service) as Service;
    const childService = childInjector.get(Service) as Service;
    const childService2 = childInjector.get(Service) as Service;
    const childService3 = childInjector.get(Service) as Service;

    expect(parentService.service).toBeInstanceOf(TestService);
    expect(childService.service).toBeInstanceOf(TestService);
    expect(parentService.service === childService.service).toEqual(false);
    expect(parentService2.service === parentService3.service).toEqual(false);
    expect(childService2.service === childService3.service).toEqual(false);
    expect(calls).toEqual(6);
  });
});