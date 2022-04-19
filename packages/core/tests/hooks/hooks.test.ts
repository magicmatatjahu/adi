import { Injector, Injectable, Inject, Scope, Token, Optional, Module, Named, when, InjectionToken, createHook, TransientScope, wait } from "../../src";

describe('Injection hooks', function() {
  test('should can use hook in injectable as option', function() {
    let called: boolean = false;
    const TestHook = createHook(() => {
      return (session, next) => {
        const value = next(session);
        called = true;
        return value;
      }
    });

    @Injectable({
      hooks: [TestHook()],
    })
    class Service {}

    const injector = Injector.create([
      Service
    ]).init() as Injector;

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(called).toEqual(true);
  });

  test('should can use hook in injectable as option and also should do not treat hook as global for token', function() {
    let calledTimes: number = 0;
    const TestHook = createHook(() => {
      return (session, next) => {
        const value = next(session);
        calledTimes++;
        return value;
      }
    });

    @Injectable({
      hooks: [TestHook()],
    })
    class Service {}

    const injector = Injector.create([
      Service,
      {
        provide: Service,
        useValue: 'foobar',
        when: when.named('foobar'),
      }
    ]).init() as Injector;

    injector.get(Service);
    injector.get(Service, [Named('foobar')]);
    expect(calledTimes).toEqual(1);
  });

  test('should not operate on original options but in the copy of the options', function () {
    let lastOptions = undefined;
    let numberOfThisSameOptions = 0;
    const TestHook = createHook(() => {
      return (session, next) => {
        if (lastOptions === session.options) {
          numberOfThisSameOptions++;
        }
        lastOptions = session.options;
        const value = next(session);
        return value;
      }
    });

    @Injectable({ scope: TransientScope })
    class TestService {}

    // use Transient scope to create Service on each injector.get(...)
    @Injectable({ scope: TransientScope })
    class Service {
      constructor(
        @Inject([TestHook()]) readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    injector.get(Service);
    injector.get(Service);
    injector.get(Service);
    injector.get(Service);
    injector.get(Service);
    expect(numberOfThisSameOptions).toEqual(0);
  });

  test('should work in useFactory inject array (in providers array)', function () {
    const injector = Injector.create([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
      {
        provide: 'useFactory',
        useFactory(useValue, stringArg) {
          return [useValue, stringArg];
        },
        inject: [[Token('useValue')], [Token(String), Optional()]],
      },
    ]).init() as Injector;

    const values = injector.get('useFactory');
    expect(values).toEqual(['foobar', undefined]);
  });

  test('should work with multiple hooks (provider based hooks)', function () {
    let order: number[] = [];
    const TestHook = createHook((nr: number) => {
      return (session, next) => {
        const value = next(session);
        order.push(nr);
        return value;
      }
    });

    const injector = Injector.create([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
      {
        provide: 'useValue',
        hooks: [TestHook(3)],
      },
      {
        provide: 'useValue',
        hooks: [TestHook(2)],
      },
      {
        provide: 'useValue',
        hooks: [TestHook(1)],
      },
    ]).init() as Injector;

    const values = injector.get('useValue');
    expect(values).toEqual('foobar');
    expect(order).toEqual([1, 2, 3]);
  });

  test('should work with order annotation', function () {
    let order: number[] = [];
    const TestHook = createHook((nr: number) => {
      return (session, next) => {
        order.push(nr);
        const value = next(session);
        order.push(nr);
        return value;
      }
    });

    const injector = Injector.create([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
      {
        provide: 'useValue',
        hooks: [TestHook(3)],
        annotations: {
          'adi:order': 3
        }
      },
      {
        provide: 'useValue',
        hooks: [TestHook(1)],
        annotations: {
          'adi:order': 1
        }
      },
      {
        provide: 'useValue',
        hooks: [TestHook(2)],
        annotations: {
          'adi:order': 2
        }
      },
    ]).init() as Injector;

    const foobar = injector.get<string>('useValue');
    expect(foobar).toEqual('foobar');
    expect(order).toEqual([1, 2, 3, 3, 2, 1]);
  });

  test('should work with multiple "thenable" hooks - sync resolution', function () {
    const TestHook = createHook(() => {
      return (session, next) => {
        return wait(next(session), value => value);
      }
    });

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      constructor(
        @Inject('token', [
          TestHook(),
          TestHook(),
        ])
        readonly value: object,  
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: "token",
        useFactory: () => {
          return 'foobar';
        }
      }
    ]).init() as Injector;

    const service1 = injector.get(Service) as Service;
    const service2 = injector.get(Service) as Service;
    expect(service1.value).toEqual('foobar');
    expect(service2.value).toEqual('foobar');
  });

  test('should work with multiple "thenable" hooks - async resolution', async function () {
    const TestHook = createHook(() => {
      return (session, next) => {
        return wait(next(session), value => value);
      }
    });

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      constructor(
        @Inject('token', [
          TestHook(),
          TestHook(),
        ])
        readonly value: string,  
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: "token",
        useFactory: async () => {
          return 'foobar';
        }
      }
    ]).init() as Injector;

    const service1 = await injector.get(Service);
    const service2 = await injector.get(Service);
    expect(service1.value).toEqual('foobar');
    expect(service2.value).toEqual('foobar');
  });

  test('should work with imported hooks', function() {
    let childCalled: boolean = false;
    const ChildHook = createHook(() => {
      return (session, next) => {
        const value = next(session);
        childCalled = true;
        return value;
      }
    });

    let parentCalled: boolean = false;
    const ParentHook = createHook(() => {
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
          hooks: [ChildHook()],
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
          hooks: [ParentHook()],
        }
      ],
    })
    class ParentModule {}

    const injector = Injector.create(ParentModule).init() as Injector;

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(childCalled).toEqual(true);
    expect(parentCalled).toEqual(true);
  });

  test('should use definition from imported module', function() {
    const token = new InjectionToken<string>();

    let childCalled: boolean = false;
    const ChildHook = createHook(() => {
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
          hooks: [ChildHook()],
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

    const injector = Injector.create(ParentModule).init() as Injector;

    const value = injector.get(token, [Named('child')]);
    expect(value).toEqual('child value');
    expect(childCalled).toEqual(true);
  });
});
