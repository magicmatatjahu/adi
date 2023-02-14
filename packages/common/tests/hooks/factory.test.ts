import { Injector, Inject, Injectable } from "@adi/core";
import { Factory, Delegation, New } from "../../src";

describe('Factory injection hook', function () {
  test('should work - using the New hook', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, [
          Factory(),
          New(),
        ])
        readonly factory: () => TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
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

  test('should work as assisted injection - with Delegate hook', function () {
    @Injectable()
    class TestService {
      constructor(
        @Inject('injected') public readonly injected: string, 
        @Inject([Delegation('0')]) readonly stringValue: string,
        @Inject([Delegation('1')]) readonly numberValue: number,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, [
          Factory(),
          New(),
        ]) 
        readonly factory: (str: string, nr: number) => TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: 'injected',
        useValue: 'injected value',
      }
    ]).init() as Injector;

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

  test('should preserve injection session', function () {
    @Injectable()
    class ServiceA {
      constructor(
        @Inject('test', [
          Factory(),
        ]) 
        public readonly foobarFactory: () => string
      ) {}
    }

    @Injectable()
    class ServiceB {
      constructor(
        @Inject('test', [Factory()]) public readonly foobarFactory: () => string
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        public readonly serviceA: ServiceA,
        public readonly serviceB: ServiceB,
      ) {}
    }

    const injector = Injector.create([
      ServiceA,
      ServiceB,
      Service,
      {
        provide: 'test',
        useValue: 'foobar',
        when(session) { return session.iMetadata.target === ServiceA; }
      },
      {
        provide: 'test',
        useValue: 'barfoo',
        when(session) { return session.iMetadata.target === ServiceB; }
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.serviceA.foobarFactory()).toEqual('foobar');
    expect(service.serviceB.foobarFactory()).toEqual('barfoo');
  });

  test('should work in async resolution', async function () {
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, [
          Factory(),
          New(),
        ])
        readonly factory: () => Promise<TestService>,
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: TestService,
        useFactory: async () => {
          return new TestService();
        }
      },
    ]).init() as Injector;

    const service = await injector.get(Service);
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

  test.todo('should destroy instances with Destroyable hook');
});
