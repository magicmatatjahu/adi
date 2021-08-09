import { Injector, Injectable, Inject, Token, Optional, Scope, createWrapper } from "../../src";

describe('Wrappers', function() {
  describe('should can use useWrapper in injectable as option', function() {
    let called: boolean = false;
    const TestWrapper = createWrapper((_: never) => {
      return (injector, session, next) => {
        const value = next(injector, session);
        called = true;
        return value;
      }
    });

    @Injectable({
      useWrapper: TestWrapper(),
    })
    class Service {}

    const injector = new Injector([
      Service
    ]);

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(called).toEqual(true);
  });

  test('should not operate on original options (type of InjectionOptions) but in the copy of the options', function () {
    let lastOptions = undefined;
    let numberOfThisSameOptions = 0;
    const TestWrapper = createWrapper((_: never) => {
      return (injector, session, next) => {
        if (lastOptions === session.options) {
          numberOfThisSameOptions++;
        }
        lastOptions = session.options;
        const value = next(injector, session);
        return value;
      }
    });

    @Injectable({ scope: Scope.TRANSIENT })
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

    injector.get(Service);
    injector.get(Service);
    injector.get(Service);
    injector.get(Service);
    injector.get(Service);
    expect(numberOfThisSameOptions).toEqual(0);
  });

  test('should works in useFactory inject array (in providers array)', function () {
    const injector = new Injector([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
      {
        provide: 'useFactory',
        useFactory(useValue, stringArg) {
          return [useValue, stringArg];
        },
        inject: [Token('useValue'), Token(String, Optional())],
      },
    ]);

    const values = injector.get('useFactory');
    expect(values).toEqual(['foobar', undefined]);
  });

  test('should works with multiple wrappers (provider based useWrapper)', function () {
    let order: number[] = [];
    const TestWrapper = createWrapper((nr: number) => {
      return (injector, session, next) => {
        const value = next(injector, session);
        order.push(nr);
        return value;
      }
    });

    const injector = new Injector([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
      {
        provide: 'useValue',
        useWrapper: TestWrapper(3),
      },
      {
        provide: 'useValue',
        useWrapper: TestWrapper(2),
      },
      {
        provide: 'useValue',
        useWrapper: TestWrapper(1),
      },
    ]);

    const values = injector.get('useValue');
    expect(values).toEqual('foobar');
    expect(order).toEqual([1, 2, 3]);
  });

  test('should works in useFactory inject array (in injectable options)', function () {
    @Injectable({
      useFactory(useValue, stringArg) {
        return [useValue, stringArg];
      },
      inject: [Token('useValue'), Token(String, Optional())],
    })
    class Service {}

    const injector = new Injector([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
      Service,
    ]);

    const values = injector.get(Service);
    expect(values).toEqual(['foobar', undefined]);
  });

  test('testing async await', async function () {
    const promise = new Promise(resolve => resolve(true));
    // console.log(await promise);
  });
});
