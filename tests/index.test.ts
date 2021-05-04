import { Injector, Injectable, Inject, Optional, NoInject, Self, SkipSelf, New } from "../src";

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
        @Inject('token', NoInject()) private token4: string,
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
});
