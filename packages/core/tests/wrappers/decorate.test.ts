import { Injector, Injectable, Inject, Decorate, NewDecorate, Delegate, NewDelegate, Fallback, createWrapper, createNewWrapper, NewFallback } from "../../src";

describe('Decorate wrapper', function () {
  test('should decorate provider (injection based useWrapper) - function decorator case', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    const functionDecorator = {
      decorate(decoratee: TestService) { return decoratee.method() + 'bar' },
      inject: [NewDelegate()],
    };

    @Injectable()
    class Service {
      constructor(
        @Inject(NewDecorate(functionDecorator)) readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toEqual('foobar');
  });

  test('should decorate provider (injection based useWrapper) - function decorator case with Delegate wrapper as second argument in inject array', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    const functionDecorator = {
      decorate(bar: string, decoratee: TestService) { return bar + decoratee.method() },
      inject: ['bar', NewDelegate()],
    };

    @Injectable()
    class Service {
      constructor(
        @Inject(NewDecorate(functionDecorator)) readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: 'bar',
        useValue: 'bar',
      }
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toEqual('barfoo');
  });

  test('should decorate provider (injection based useWrapper) - double decorator - function decorator case', function () {
    @Injectable()
    class AwesomeService {
      addAwesome() {
        return ' is awesome';
      }
    }

    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    const decorator1 = {
      decorate(service: AwesomeService, decoratee: TestService) { return decoratee.method() + 'bar' + service.addAwesome() },
      inject: [AwesomeService, NewDelegate()],
    };

    const decorator2 = {
      decorate(value: string, exclamation: string) { return `(${value + exclamation})` },
      inject: [NewDelegate(), 'exclamation'],
    };

    @Injectable()
    class Service {
      constructor(
        @Inject([
          NewDecorate(decorator2), 
          NewDecorate(decorator1),
        ]) 
        readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      AwesomeService,
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toEqual('(foobar is awesome!)');
  });

  test('should decorate provider (injection based useWrapper) - class decorator case with constructor injection', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    @Injectable()
    class DecoratorService implements TestService {
      constructor(
        @Inject('exclamation') readonly exclamation: string,
        @Inject(NewDelegate()) public decoratee: any,
      ) {}

      method() {
        return this.decoratee.method() + 'bar' + this.exclamation;
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(NewDecorate(DecoratorService)) readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toBeInstanceOf(DecoratorService);
    expect((service.service as DecoratorService).decoratee).toBeInstanceOf(TestService);
    expect(service.service.method()).toEqual('foobar!');
  });

  test('should decorate provider (injection based useWrapper) - class decorator case with property injection', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    @Injectable()
    class DecoratorService implements TestService {
      @Inject(NewDelegate())
      public decoratee: any;

      constructor(
        @Inject('exclamation') readonly exclamation: string,
      ) {}

      method() {
        return this.decoratee.method() + 'bar' + this.exclamation;
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(NewDecorate(DecoratorService)) readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toBeInstanceOf(DecoratorService);
    expect((service.service as DecoratorService).decoratee).toBeInstanceOf(TestService);
    expect(service.service.method()).toEqual('foobar!');
  });

  test('should decorate provider (injection based useWrapper) - double decorator - class decorator case', function () {
    @Injectable()
    class AwesomeService {
      addAwesome() {
        return ' is awesome';
      }
    }

    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    @Injectable()
    class DecoratorService1 implements TestService {
      constructor(
        @Inject(NewDelegate()) public decoratee: any,
        public service: AwesomeService,
      ) {}

      method() {
        return this.decoratee.method() + 'bar' + this.service.addAwesome();
      }
    }

    @Injectable()
    class DecoratorService2 implements TestService {
      constructor(
        @Inject('exclamation') readonly exclamation: string,
        @Inject(NewDelegate()) public decoratee: any,
      ) {}

      method() {
        return `(${this.decoratee.method() + this.exclamation})`
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject([
          NewDecorate(DecoratorService2), 
          NewDecorate(DecoratorService1)
        ])
        readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      AwesomeService,
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toBeInstanceOf(DecoratorService2);
    expect((service.service as DecoratorService2).decoratee).toBeInstanceOf(DecoratorService1);
    expect(service.service.method()).toEqual('(foobar is awesome!)');
  });

  test('should decorate provider (provider based useWrapper) - function decorator case', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
      ) {}
    }

    const functionDecorator = {
      decorate(decoratee: TestService) { return decoratee.method() + 'bar' },
      inject: [NewDelegate()]
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: TestService,
        useWrapper: NewDecorate(functionDecorator),
      }
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toEqual('foobar');
  });

  test('should decorate provider (provider based useWrapper) - class decorator', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    @Injectable()
    class DecoratorService implements TestService {
      @Inject(NewDelegate())
      public decoratee: TestService;

      constructor(
        @Inject('exclamation') readonly exclamation: string,
      ) {}

      method() {
        return this.decoratee.method() + 'bar' + this.exclamation;
      }
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: TestService,
        useWrapper: NewDecorate(DecoratorService),
      },
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toBeInstanceOf(DecoratorService);
    expect((service.service as DecoratorService).decoratee).toBeInstanceOf(TestService);
    expect(service.service.method()).toEqual('foobar!');
  });

  test('should decorate provider with custom wrappers on delegate injection', function () {
    let called: boolean = false;
    const TestWrapper = createNewWrapper(() => {
      return (session, next) => {
        const value = next(session);
        called = true;
        return value;
      }
    });

    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    @Injectable()
    class DecoratorService implements TestService {
      @Inject([
        TestWrapper(),
        NewDelegate(),
      ])
      public decoratee: TestService;

      constructor(
        @Inject('exclamation') readonly exclamation: string,
      ) {}

      method() {
        return this.decoratee.method() + 'bar' + this.exclamation;
      }
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: TestService,
        useWrapper: NewDecorate(DecoratorService),
      },
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toBeInstanceOf(DecoratorService);
    expect((service.service as DecoratorService).decoratee).toBeInstanceOf(TestService);
    expect(service.service.method()).toEqual('foobar!');
    expect(called).toEqual(true);
  });

  test('should decorate provider in the method injection', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    @Injectable()
    class DecoratorService implements TestService {
      constructor(
        @Inject('exclamation') readonly exclamation: string,
      ) {}

      method(@Inject(NewDelegate()) decoratee?: TestService): string {
        return decoratee?.method() + 'bar' + this.exclamation;
      }
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: TestService,
        useWrapper: NewDecorate(DecoratorService),
      },
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toBeInstanceOf(DecoratorService);
    expect(service.service.method()).toEqual('foobar!');
  });

  test('should works in definition based useWrapper', function () {
    const injector = new Injector([
      {
        provide: 'test',
        useValue: 'foobar',
        useWrapper: NewDecorate({
          decorate(decoratee: string, exclamation: string) { return decoratee + exclamation; },
          inject: [NewDelegate(), 'exclamation'],
        }),
      },
      {
        provide: 'exclamation',
        useValue: '!',
      },
    ]);

    const t = injector.newGet('test') as string;
    expect(t).toEqual('foobar!');
  });

  test('Decorate wrapper should provides in absent use case - using Fallback wrapper', function () {
    class Service {}

    @Injectable()
    class DecoratorService {
      constructor(
        @Inject(NewDelegate()) readonly service: any,
      ) {}
    }

    const injector = new Injector([
      {
        provide: 'test',
        useValue: 'foobar'
      },
      {
        provide: Service,
        useWrapper: [
          NewFallback('test'),
          NewDecorate(DecoratorService),
        ],
      },
    ]);

    const service = injector.newGet(Service) as DecoratorService;
    expect(service).toEqual('foobar');
  });

  test('Decorate wrapper should decorate only once', function () {
    let calledTimes = 0;

    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    @Injectable()
    class DecoratorService implements TestService {
      @Inject(NewDelegate())
      public decoratee: TestService;

      constructor(
        @Inject('exclamation') readonly exclamation: string,
      ) {
        calledTimes++;
      }

      method() {
        return this.decoratee.method() + 'bar' + this.exclamation;
      }
    }

    @Injectable()
    class Service {
      constructor(
        readonly service1: TestService,
        readonly service2: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: TestService,
        useWrapper: NewDecorate(DecoratorService),
      },
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]);

    const service = injector.newGet(Service);
    expect(service.service1).toBeInstanceOf(DecoratorService);
    expect((service.service1 as DecoratorService).decoratee).toBeInstanceOf(TestService);
    expect(service.service1.method()).toEqual('foobar!');
    expect(service.service1 === service.service2).toEqual(true);
    expect(calledTimes).toEqual(1);
  });

  test('should work without inject array - function decorator case (pass as first argument the decoratee value)', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    const functionDecorator = {
      decorate(decoratee: TestService) { return decoratee.method() + 'bar' },
    };

    @Injectable()
    class Service {
      constructor(
        @Inject(NewDecorate(functionDecorator)) readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toEqual('foobar');
  });
});
