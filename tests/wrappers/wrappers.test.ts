import { Injector, Injectable, Inject, Token, Optional, Scope, Value, createWrapper, ANNOTATIONS, Memo } from "../../src";

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

  describe('should works as Injectable metadata', function() {
    @Injectable({
      useWrapper: Value('foo.bar')
    })
    class Service {
      public foo = {
        bar: 'foobar'
      }
    }

    const injector = new Injector([
      Service,
      {
        provide: "token",
        useValue: {
          foo: {
            bar: 'foobar'
          }
        },
      }
    ]);

    const service = injector.get(Service);
    expect(service).toEqual('foobar');
  });

  test('should works with order annotation', function () {
    const injector = new Injector([
      {
        provide: 'useValue',
        useValue: {
          a: {
            b: {
              c: {
                d: {
                  e: {
                    f: 'foobar',
                  }
                }
              }
            }
          }
        },
      },
      {
        provide: 'useValue',
        useWrapper: Value('a.b'),
        annotations: {
          [ANNOTATIONS.ORDER]: 3
        }
      },
      {
        provide: 'useValue',
        useWrapper: Value('e.f'),
        annotations: {
          [ANNOTATIONS.ORDER]: 1
        }
      },
      {
        provide: 'useValue',
        useWrapper: Value('c.d'),
        annotations: {
          [ANNOTATIONS.ORDER]: 2
        }
      },
    ]);

    const foobar = injector.get<string>('useValue');
    expect(foobar).toEqual('foobar');
  });

  test('should works with multiple "thenable" wrappers - sync resolution', function () {
    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class Service {
      constructor(
        @Inject('token', Memo(Value('a.b'))) readonly value: object,  
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: "token",
        useFactory: () => {
          return {
            a: {
              b: {
                c: 'foobar',
              }
            }
          }
        }
      }
    ]);

    const service1 = injector.get(Service);
    const service2 = injector.get(Service);
    expect(service1.value).toEqual({ c: 'foobar' });
    expect(service2.value).toEqual({ c: 'foobar' });
    expect(service1.value === service2.value).toEqual(true);
  });

  test('should works with multiple "thenable" wrappers - async resolution', async function () {
    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class Service {
      constructor(
        @Inject('token', Memo(Value('a.b'))) readonly value: object,  
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: "token",
        useFactory: async () => {
          return {
            a: {
              b: {
                c: 'foobar',
              }
            }
          }
        }
      }
    ]);

    const service1 = await injector.getAsync(Service);
    const service2 = await injector.getAsync(Service);
    expect(service1.value).toEqual({ c: 'foobar' });
    expect(service2.value).toEqual({ c: 'foobar' });
    expect(service1.value === service2.value).toEqual(true);
  });
});
