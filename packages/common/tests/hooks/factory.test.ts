import { Injector, Inject, Injectable, New } from "@adi/core";

import { Delegation } from "../../src/hooks/delegation";
import { Factory } from "../../src/hooks/factory";

describe('Factory injection hook', function () {
  test('should work - using the New hook', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, Factory(), New())
        readonly factory: () => TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ])

    const service = injector.getSync(Service)
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
        @Inject(Delegation(0)) readonly stringValue: string,
        @Inject(Delegation(1)) readonly numberValue: number,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, Factory(), New()) 
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
    ])

    const service = injector.getSync(Service);
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
        @Inject('test', Factory()) 
        public readonly foobarFactory: () => string
      ) {}
    }

    @Injectable()
    class ServiceB {
      constructor(
        @Inject('test', Factory()) 
        public readonly foobarFactory: () => string
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
        when(session) { return session.metadata.target === ServiceA; }
      },
      {
        provide: 'test',
        useValue: 'barfoo',
        when(session) { return session.metadata.target === ServiceB; }
      }
    ])

    const service = injector.getSync(Service)
    expect(service.serviceA.foobarFactory()).toEqual('foobar');
    expect(service.serviceB.foobarFactory()).toEqual('barfoo');
  });

  test('should work in async resolution', async function () {
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, Factory(), New())
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
    ])

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

  test('should work with custom delegation keys', function () {
    @Injectable()
    class TestService {
      constructor(
        @Inject('injected') public readonly injected: string, 
        @Inject(Delegation('foo')) readonly stringValue: string,
        @Inject(Delegation('bar')) readonly numberValue: number,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, Factory({ delegations: ['foo', 'bar'] }), New()) 
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
    ])

    const service = injector.getSync(Service);
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

  test('should work as assisted injection - with Delegate hook and based on reflection types', function () {
    @Injectable()
    class TestService {
      constructor(
        @Inject('injected') public readonly injected: string, 
        @Inject(Delegation()) readonly stringValue: string,
        @Inject(Delegation()) readonly numberValue: number,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, Factory(), New()) 
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
    ])

    const service = injector.getSync(Service)
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

  test('should work as assisted injection - with Delegate hook and based on reflection types (mix of custom delegation keys and reflection types)', function () {
    @Injectable()
    class TestService {
      constructor(
        @Inject('injected') public readonly injected: string, 
        @Inject(Delegation('second-string')) readonly stringValue2: string,
        @Inject(Delegation('first-string')) readonly stringValue1: string,
        @Inject(Delegation()) readonly numberValue: number,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(TestService, Factory({ delegations: ['first-string', undefined, 'second-string'] }), New()) 
        readonly factory: (stringValue1: string, nr: number, stringValue2: string ) => TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: 'injected',
        useValue: 'injected value',
      }
    ])

    const service = injector.getSync(Service)
    const testService1 = service.factory("foo", 1, "bar");
    const testService2 = service.factory("bar", 2, "foo");
    expect(testService1 === testService2).toEqual(false);
    expect(testService1.injected).toEqual('injected value');
    expect(testService1.stringValue1).toEqual('foo');
    expect(testService1.stringValue2).toEqual('bar');
    expect(testService1.numberValue).toEqual(1);
    expect(testService2.injected).toEqual('injected value');
    expect(testService2.stringValue1).toEqual('bar');
    expect(testService2.stringValue2).toEqual('foo');
    expect(testService2.numberValue).toEqual(2);
  });

  test.todo('should destroy instances with Destroyable hook');
});
