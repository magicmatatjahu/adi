import { Injector, Inject, Injectable, NewFactory, NewDelegate, NewNew } from "../../src";

describe('Factory wrapper', function () {
  test('should works (injection based wrapper) - using the New wrapper', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, [
          NewFactory(),
          NewNew(),
        ])
        readonly factory: () => TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.newGet(Service);
    const testService1 = service.factory();
    const testService2 = service.factory();
    const testService3 = service.factory();
    expect(testService1).toBeInstanceOf(TestService);
    expect(testService2).toBeInstanceOf(TestService);
    expect(testService3).toBeInstanceOf(TestService);
    expect(testService1 === testService2).toEqual(false);
    expect(testService1 === testService2).toEqual(false);
    expect(testService1 === testService2).toEqual(false);
    expect(testService1 === testService3).toEqual(false);
    expect(testService2 === testService3).toEqual(false);
  });

  test('should works as assisted injection (injection based wrapper) - with Delegate wrapper', function () {
    @Injectable()
    class TestService {
      constructor(
        @Inject('injected') public readonly injected: string, 
        @Inject(NewDelegate(0)) readonly stringValue: string,
        @Inject(NewDelegate(1)) readonly numberValue: number,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, [
          NewFactory(),
          NewNew(),
        ]) 
        readonly factory: (str: string, nr: number) => TestService,
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

    const service = injector.newGet(Service);
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

  test('should preserve injection session', function () {
    @Injectable()
    class A {
      constructor(
        @Inject('test', [
          NewFactory(),
        ]) 
        public readonly foobarFactory: () => string
      ) {}
    }

    @Injectable()
    class B {
      constructor(
        @Inject('test', NewFactory()) public readonly foobarFactory: () => string
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
        when(session) { return session.metadata.target === A; }
      },
      {
        provide: 'test',
        useValue: 'barfoo',
        when(session) { return session.metadata.target === B }
      }
    ]);

    const service = injector.newGet(Service);
    expect(service.serviceA.foobarFactory()).toEqual('foobar');
    expect(service.serviceB.foobarFactory()).toEqual('barfoo');
  });

  test('should works in async resolution', async function () {
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, [
          NewFactory(),
          NewNew(),
        ])
        readonly factory: () => TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: TestService,
        useFactory: async () => {
          return new TestService();
        }
      },
    ]);

    const service = await injector.newGetAsync(Service);
    const testService1 = service.factory();
    const testService2 = service.factory();
    const testService3 = service.factory();
    expect(testService1).toBeInstanceOf(Promise);
    expect(testService2).toBeInstanceOf(Promise);
    expect(testService3).toBeInstanceOf(Promise);
    expect(await testService1).toBeInstanceOf(TestService);
    expect(await testService2).toBeInstanceOf(TestService);
    expect(await testService3).toBeInstanceOf(TestService);
    expect(await testService1 === await testService2).toEqual(false);
    expect(await testService1 === await testService3).toEqual(false);
    expect(await testService2 === await testService3).toEqual(false);
  });
});
