import { Injector, Inject, Injectable, Factory, New, Assisted, createWrapper } from "../../src";

describe('Factory wrapper', function () {
  test('should works (injection based wrapper) - using the New wrapper', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, Factory(New())) readonly factory: () => TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service) as Service;
    const testService1 = service.factory();
    const testService2 = service.factory();
    const testService3 = service.factory();
    expect(testService1 === testService2).toEqual(false);
    expect(testService1 === testService3).toEqual(false);
    expect(testService2 === testService3).toEqual(false);
  });

  test('should works as assisted injection (injection based wrapper) - with Assisted wrapper', function () {
    @Injectable()
    class TestService {
      constructor(
        @Inject('injected') public readonly injected: string, 
        @Inject(Assisted(0)) readonly stringValue: string,
        @Inject(Assisted(1)) readonly numberValue: number,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, Factory(New())) readonly factory: (str: string, nr: number) => TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: 'injected',
        useValue: 'injected value',
      }
    ]);

    const service = injector.get(Service) as Service;
    const testService1 = service.factory("foo", 1);
    const testService2 = service.factory("bar", 2);
    expect(testService1 === testService2).toEqual(false);
    expect(testService1.injected).toEqual('injected value');
    expect(testService1.stringValue).toEqual('foo');
    expect(testService1.numberValue).toEqual(1);
    expect(testService2.injected).toEqual('injected value');
    expect(testService2.stringValue).toEqual('bar');
    expect(testService2.numberValue).toEqual(2);
  });

  test('Assisted wrapper should works without Factory', function () {
    let called: boolean = false;
    const TestWrapper = createWrapper((_: never) => {
      return (injector, session, next) => {
        const value = next(injector, session);
        called = true;
        return value;
      }
    });

    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Assisted(TestWrapper())) readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(TestService);
  });

  test('should preserve injection session', function () {
    @Injectable()
    class A {
      constructor(
        @Inject('test', Factory()) public readonly foobarFactory: () => string
      ) {}
    }

    @Injectable()
    class B {
      constructor(
        @Inject('test', Factory()) public readonly foobarFactory: () => string
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        public readonly serviceA: A,
        public readonly serviceB: B,
      ) {}
    }

    const injector = new Injector([
      A,
      B,
      Service,
      {
        provide: 'test',
        useValue: 'foobar',
        when(session) { return session.meta.target === A; }
      },
      {
        provide: 'test',
        useValue: 'barfoo',
        when(session) { return session.meta.target === B }
      }
    ]);

    const service = injector.get(Service) as Service;
    expect(service.serviceA.foobarFactory()).toEqual('foobar');
    expect(service.serviceB.foobarFactory()).toEqual('barfoo');
  });
});
