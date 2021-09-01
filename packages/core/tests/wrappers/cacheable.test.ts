import { Injector, Injectable, Inject, New, Scope, createWrapper } from "../../src";

describe('Cacheable wrapper', function () {
  test('should cache injection with simple provider (with DEFAULT scope)', function () {
    let calls = 0;

    const TestWrapper = createWrapper((_: never) => {
      return (injector, session, next) => {
        const value = next(injector, session);
        calls++;
        return value;
      }
    });

    @Injectable()
    class TestService {}

    // use Transient scope to create Service on each injector.get(...)
    @Injectable({ scope: Scope.TRANSIENT })
    class Service {
      constructor(
        @Inject(TestWrapper()) readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service1 = injector.get(Service) ;
    const service2 = injector.get(Service) ;
    const service3 = injector.get(Service) ;

    expect(service1.service).toBeInstanceOf(TestService);
    expect(service1.service).toEqual(service2.service);
    expect(service1.service).toEqual(service3.service);
    expect(calls).toEqual(1);
  });

  test('should not cache injection with side effects - case with New wrapper', function () {
    let calls = 0;

    const TestWrapper = createWrapper((_: never) => {
      return (injector, session, next) => {
        const value = next(injector, session);
        calls++;
        return value;
      }
    });

    @Injectable()
    class TestService {}

    // use Transient scope to create Service on each injector.get(...)
    @Injectable({ scope: Scope.TRANSIENT })
    class Service {
      constructor(
        @Inject(TestWrapper(New())) readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service1 = injector.get(Service) ;
    const service2 = injector.get(Service) ;
    const service3 = injector.get(Service) ;

    expect(service1.service).toBeInstanceOf(TestService);
    expect(service1.service === service2.service).toEqual(false);
    expect(service1.service === service3.service).toEqual(false);
    expect(service2.service === service3.service).toEqual(false);
    expect(calls).toEqual(3);
  });

  test('should not cache injection in different modules - case when this same provider is provided in different modules', function () {
    let calls = 0;

    const TestWrapper = createWrapper((_: never) => {
      return (injector, session, next) => {
        const value = next(injector, session);
        calls++;
        return value;
      }
    });

    @Injectable()
    class TestService {}

    // use Transient scope to create Service on each injector.get(...)
    @Injectable({ scope: Scope.TRANSIENT })
    class Service {
      constructor(
        @Inject(TestWrapper()) readonly service: TestService,
      ) {}
    }

    const injector1 = new Injector([
      Service,
      TestService,
    ]);
    const injector2 = new Injector([
      Service,
      TestService,
    ]);

    const service1 = injector1.get(Service) ;
    injector1.get(Service) ;
    injector1.get(Service) ;
    const service2 = injector2.get(Service) ;
    injector2.get(Service) ;
    injector2.get(Service) ;

    expect(service1.service).toBeInstanceOf(TestService);
    expect(service2.service).toBeInstanceOf(TestService);
    expect(service1.service === service2.service).toEqual(false);
    expect(calls).toEqual(2);
  });

  test('should not cache injection in different modules - case when this same provider is provided in different modules with sideEffects', function () {
    let calls = 0;

    const TestWrapper = createWrapper((_: never) => {
      return (injector, session, next) => {
        const value = next(injector, session);
        calls++;
        return value;
      }
    });

    @Injectable()
    class TestService {}

    // use Transient scope to create Service on each injector.get(...)
    @Injectable({ scope: Scope.TRANSIENT })
    class Service {
      constructor(
        @Inject(TestWrapper(New())) readonly service: TestService,
      ) {}
    }

    const injector1 = new Injector([
      Service,
      TestService,
    ]);
    const injector2 = new Injector([
      Service,
      TestService,
    ]);

    const service1 = injector1.get(Service) ;
    injector1.get(Service) ;
    injector1.get(Service) ;
    const service2 = injector2.get(Service) ;
    injector2.get(Service) ;
    injector2.get(Service) ;

    expect(service1.service).toBeInstanceOf(TestService);
    expect(service2.service).toBeInstanceOf(TestService);
    expect(service1.service === service2.service).toEqual(false);
    expect(calls).toEqual(6);
  });

  test('should not cache injection in different modules - case when this same provider is provided in parent injector', function () {
    let calls = 0;

    const TestWrapper = createWrapper((_: never) => {
      return (injector, session, next) => {
        const value = next(injector, session);
        calls++;
        return value;
      }
    });

    @Injectable()
    class TestService {}

    // use Transient scope to create Service on each injector.get(...)
    @Injectable({ scope: Scope.TRANSIENT })
    class Service {
      constructor(
        @Inject(TestWrapper()) readonly service: TestService,
      ) {}
    }

    const parentInjector = new Injector([
      Service,
      TestService,
    ]);
    const childInjector = new Injector([
      Service,
      TestService,
    ], parentInjector);

    const parentService = parentInjector.get(Service) ;
    parentInjector.get(Service) ;
    parentInjector.get(Service) ;
    const childService = childInjector.get(Service) ;
    childInjector.get(Service) ;
    childInjector.get(Service) ;

    expect(parentService.service).toBeInstanceOf(TestService);
    expect(childService.service).toBeInstanceOf(TestService);
    expect(parentService.service === childService.service).toEqual(false);
    expect(calls).toEqual(2);
  });

  test('should not cache injection in different modules - case when this same provider is provided in parent injector with sideEffects', function () {
    let calls = 0;

    const TestWrapper = createWrapper((_: never) => {
      return (injector, session, next) => {
        const value = next(injector, session);
        calls++;
        return value;
      }
    });

    @Injectable()
    class TestService {}

    // use Transient scope to create Service on each injector.get(...)
    @Injectable({ scope: Scope.TRANSIENT })
    class Service {
      constructor(
        @Inject(TestWrapper(New())) readonly service: TestService,
      ) {}
    }

    const parentInjector = new Injector([
      Service,
      TestService,
    ]);
    const childInjector = new Injector([
      Service,
      TestService,
    ], parentInjector);

    const parentService = parentInjector.get(Service) ;
    const parentService2 = parentInjector.get(Service) ;
    const parentService3 = parentInjector.get(Service) ;
    const childService = childInjector.get(Service) ;
    const childService2 = childInjector.get(Service) ;
    const childService3 = childInjector.get(Service) ;

    expect(parentService.service).toBeInstanceOf(TestService);
    expect(childService.service).toBeInstanceOf(TestService);
    expect(parentService.service === childService.service).toEqual(false);
    expect(parentService2.service === parentService3.service).toEqual(false);
    expect(childService2.service === childService3.service).toEqual(false);
    expect(calls).toEqual(6);
  });
});