import { Injector, Injectable, Inject, Scope, createNewWrapper, ANNOTATIONS, NewToken, NewOptional, NewPath, NewMemo, Module, NewNamed, when, InjectionToken } from "../../src";

describe('Wrappers', function() {
  describe('should can use useWrapper in injectable as option', function() {
    let called: boolean = false;
    const TestWrapper = createNewWrapper(() => {
      return (session, next) => {
        const value = next(session);
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

    const service = injector.newGet(Service);
    expect(service).toBeInstanceOf(Service);
    expect(called).toEqual(true);
  });

  test('should not operate on original options (type of InjectionOptions) but in the copy of the options', function () {
    let lastOptions = undefined;
    let numberOfThisSameOptions = 0;
    const TestWrapper = createNewWrapper(() => {
      return (session, next) => {
        if (lastOptions === session.options) {
          numberOfThisSameOptions++;
        }
        lastOptions = session.options;
        const value = next(session);
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

    injector.newGet(Service);
    injector.newGet(Service);
    injector.newGet(Service);
    injector.newGet(Service);
    injector.newGet(Service);
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
        inject: [NewToken('useValue'), [NewToken(String), NewOptional()]],
      },
    ]);

    const values = injector.get('useFactory');
    expect(values).toEqual(['foobar', undefined]);
  });

  test('should works with multiple wrappers (provider based useWrapper)', function () {
    let order: number[] = [];
    const TestWrapper = createNewWrapper((nr: number) => {
      return (session, next) => {
        const value = next(session);
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

    const values = injector.newGet('useValue');
    expect(values).toEqual('foobar');
    expect(order).toEqual([1, 2, 3]);
  });

  test('should works in useFactory inject array (in injectable options)', function () {
    @Injectable({
      useFactory(useValue, stringArg) {
        return [useValue, stringArg];
      },
      inject: [NewToken('useValue'), [NewToken(String), NewOptional()]],
    })
    class Service {}

    const injector = new Injector([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
      Service,
    ]);

    const values = injector.newGet(Service);
    expect(values).toEqual(['foobar', undefined]);
  });

  describe('should works as Injectable metadata', function() {
    @Injectable({
      useWrapper: NewPath('foo.bar')
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

    const service = injector.newGet(Service);
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
        useWrapper: NewPath('a.b'),
        annotations: {
          [ANNOTATIONS.ORDER]: 3
        }
      },
      {
        provide: 'useValue',
        useWrapper: NewPath('e.f'),
        annotations: {
          [ANNOTATIONS.ORDER]: 1
        }
      },
      {
        provide: 'useValue',
        useWrapper: NewPath('c.d'),
        annotations: {
          [ANNOTATIONS.ORDER]: 2
        }
      },
    ]);

    const foobar = injector.newGet<string>('useValue');
    expect(foobar).toEqual('foobar');
  });

  test('should works with multiple "thenable" wrappers - sync resolution', function () {
    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class Service {
      constructor(
        @Inject('token', [
          NewMemo(),
          NewPath('a.b')
        ])
        readonly value: object,  
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

    const service1 = injector.newGet(Service);
    const service2 = injector.newGet(Service);
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
        @Inject('token', [
          NewMemo(),
          NewPath('a.b'),
        ])
        readonly value: object,  
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: "token",
        useFactory: async (value: object) => {
          return value;
        },
        inject: ['value'],
      },
      {
        provide: "value",
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

    const service1 = await injector.newGetAsync(Service);
    const service2 = await injector.newGetAsync(Service);
    expect(service1.value).toEqual({ c: 'foobar' });
    expect(service2.value).toEqual({ c: 'foobar' });
    expect(service1.value === service2.value).toEqual(true);
  });

  test('should works with imported wrappers', function() {
    let childCalled: boolean = false;
    const ChildWrapper = createNewWrapper(() => {
      return (session, next) => {
        const value = next(session);
        childCalled = true;
        return value;
      }
    });

    let parentCalled: boolean = false;
    const ParentWrapper = createNewWrapper(() => {
      return (session, next) => {
        const value = next(session);
        parentCalled = true;
        return value;
      }
    });

    @Injectable()
    class Service {}

    @Module({
      providers: [
        {
          provide: Service,
          useWrapper: ChildWrapper(),
        }
      ],
      exports: [
        Service,
      ]
    })
    class ChildModule {}

    @Module({
      imports: [
        ChildModule,
      ],
      providers: [
        Service,
        {
          provide: Service,
          useWrapper: ParentWrapper(),
        }
      ],
    })
    class ParentModule {}

    const injector = Injector.create(ParentModule).build();

    const service = injector.newGet(Service);
    expect(service).toBeInstanceOf(Service);
    expect(childCalled).toEqual(true);
    expect(parentCalled).toEqual(true);
  });

  test('should use definition from imported module', function() {
    const token = new InjectionToken<string>();

    let childCalled: boolean = false;
    const ChildWrapper = createNewWrapper(() => {
      return (session, next) => {
        const value = next(session);
        childCalled = true;
        return value;
      }
    });

    @Module({
      providers: [
        {
          provide: token,
          useValue: 'child value',
          when: when.named('child')
        },
        {
          provide: token,
          useWrapper: ChildWrapper(),
        }
      ],
      exports: [
        token,
      ]
    })
    class ChildModule {}

    @Module({
      imports: [
        ChildModule,
      ],
      providers: [
        {
          provide: token,
          useValue: 'parent value',
          when: when.named('parent')
        }
      ],
    })
    class ParentModule {}

    const injector = Injector.create(ParentModule).build();

    const value = injector.newGet(token, NewNamed('child'));
    expect(value).toEqual('child value');
    expect(childCalled).toEqual(true);
  });

  test('should work with @Inject decorator', function() {
    const token = new InjectionToken<string>();

    let called: boolean = false;
    const TestWrapper = createNewWrapper(() => {
      return (session, next) => {
        const value = next(session);
        called = true;
        return value;
      }
    });

    @Module({
      providers: [
        {
          provide: token,
          useValue: 'child value',
          when: when.named('child')
        },
      ],
      exports: [
        token,
      ]
    })
    class ChildModule {}

    @Injectable()
    class Service {
      constructor(
        @Inject(token, [NewNamed('child'), TestWrapper()]) public value: string,
      ) {}
    }

    @Module({
      imports: [
        ChildModule,
      ],
      providers: [
        Service,
        {
          provide: token,
          useValue: 'parent value',
          when: when.named('parent')
        }
      ],
    })
    class ParentModule {}

    const injector = Injector.create(ParentModule).build();

    const service = injector.newGet(Service);
    expect(service.value).toEqual('child value');
    expect(called).toEqual(true);
  });
});
