import { Injector, Injectable, Inject } from "../src";

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
      }
    ]);

    const serviceB = injector.get(ServiceB);
    console.log(serviceB);

    expect(true).toEqual(true);
  });
});
