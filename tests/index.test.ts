import { Injector, Injectable, Inject, Token, Ref, Optional, Skip, Self, SkipSelf, New, Lazy, Named, Multi, Decorate, Context } from "../src";
import { STATIC_CONTEXT } from "../src/constants";

describe.skip('test', function() {
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

  test('inheritance', function() {
    @Injectable()
    class TestService {
    }

    @Injectable()
    class Service {
      constructor(
        @Inject() readonly testService: TestService,
      ) {}
    }

    @Injectable()
    class ExtendedService extends Service {
      @Inject()
      readonly testService2: TestService;
    }

    const injector = new Injector([
      TestService,
      Service,
      ExtendedService,
    ]);

    const service = injector.get(ExtendedService) as ExtendedService;
    console.log(service);

    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService).toEqual(service.testService2);
  });
});
