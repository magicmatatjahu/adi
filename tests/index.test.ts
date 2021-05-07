import { Injector, Injectable, Inject, Token, Ref, Optional, Skip, Self, SkipSelf, New, Lazy, Named, Multi, Decorate } from "../src";

describe('test', function() {
  test('test', function() {
    @Injectable()
    class ServiceA {
      constructor(
        @Inject('token') private service: string,
      ) {}
    }

    @Injectable()
    class ServiceB {
      constructor(
        private service: ServiceA,
        @Inject('token3', Optional(Self())) private token3: string,
      ) {}
    }

    const injector = new Injector([
      ServiceA,
      ServiceB,
      {
        provide: "token",
        useValue: 'foo',
      },
      {
        provide: "token2",
        useValue: 'bar',
      },
      {
        provide: "token",
        useWrapper: (inj, session, next) => {
          const bar = inj.get('token2');
          return `${next(inj, session)}${bar}`;
        }
      },
      {
        provide: 'token3',
        useValue: 'foobar',
      },
      // {
      //   provide: 'token3',
      //   useWrapper: New(),
      // }
    ]);

    // const serviceB = injector.get(ServiceB);
    // console.log(serviceB);

    expect(true).toEqual(true);
  });

  test('hierarchical injectors', function() {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', SkipSelf()) private token: string,
        @Inject('token2', Self()) private token2: string,
        @Inject('token3', Optional()) private token3: string,
        @Inject('token', Skip()) private token4: string,
      ) {}
    }

    const injector = new Injector([
      {
        provide: "token",
        useValue: 'foo',
      },
      {
        provide: "token2",
        useValue: 'bar',
      },
    ]);
    const childInjector = new Injector([
      Service,
      {
        provide: "token",
        useValue: 'bar',
      },
      {
        provide: "token2",
        useValue: 'foo',
      },
    ], injector);

    const service = childInjector.get(Service);
    console.log(service);

    expect(true).toEqual(true);
  });

  test('New wrapper', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        public test1: TestService,
        // fix inferring of types
        @Inject(New()) public test2: TestService,
        @Inject(New()) public test3: TestService,
      ) {}
    }

    const injector = new Injector([
      TestService,
      Service,
    ]);

    const service = injector.get(Service) as Service;

    expect(service.test1 === service.test2).toEqual(false);
    expect(service.test1 === service.test3).toEqual(false);
    expect(service.test2 === service.test3).toEqual(false);
  });

  test('Named wrapper and constraint', function() {
    @Injectable()
    class Service {
      constructor(
        @Inject('token') public token: string,
        @Inject('token', Named('named')) public namedToken: string,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: 'token',
        useValue: 'foobar'
      },
      {
        provide: 'token',
        useValue: 'namedFoobar',
        when: (session) => session.options.attrs['named'] === 'named',
      }
    ]);

    const service = injector.get(Service) as Service;
    console.log(service);

    expect(true).toEqual(true);
  });

  test('Multi provider (wrapper)', function() {
    @Injectable()
    class Service {
      constructor(
        @Inject('token') public noMulti: string,
        @Inject('token', Named('multi', Multi())) public multi: string[],
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: 'token',
        useValue: 'no-multi'
      },
      {
        provide: 'token',
        useValue: 'multi1',
        when: (session) => session.options.attrs['named'] === 'multi',
      },
      {
        provide: 'token',
        useValue: 'multi2',
        when: (session) => session.options.attrs['named'] === 'multi',
      },
      {
        provide: 'token',
        useValue: 'multi3',
        when: (session) => session.options.attrs['named'] === 'multi',
      }
    ]);

    const service = injector.get(Service) as Service;
    console.log(service);

    expect(true).toEqual(true);
  });

  test('Lazy wrapper', function() {
    @Injectable()
    class LazyService {
      constructor() {}
      method() { return 'lazy foobar'; }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(Lazy()) public token: LazyService,
      ) {}
    }

    const injector = new Injector([
      Service,
      LazyService,
    ]);

    const service = injector.get(Service) as Service;
    console.log(service.token.method());

    expect(true).toEqual(true);
  });

  test('Decorate wrapper', function() {
    @Injectable()
    class Service {
      constructor() {}

      method() {
        return "foo";
      }
    }

    class Decorator {
      constructor(readonly service: Service) {}

      method() { return this.service.method() + 'bar'; }
    }

    const injector = new Injector([
      Service,
      {
        provide: Service,
        useWrapper: Decorate(Decorator),
      }
    ]);

    const service = injector.get(Service) as Service;
    console.log(service.method());

    expect(true).toEqual(true);
  });

  test('useFactory', function() {
    @Injectable()
    class Service1 {}

    class Service2 {}

    const injector = new Injector([
      Service1,
      {
        provide: 'useFactory',
        useFactory: (...args) => {
          return args;
        },
        inject: [Service1, Token(Service2, Optional()), Token(Service1, New())],
      }
    ]);

    const useFactory = injector.get('useFactory');
    console.log(useFactory);

    expect(true).toEqual(true);
  });
});
