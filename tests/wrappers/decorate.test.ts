import { Injector, Injectable, Inject, Decorate, Delegate, Fallback, createWrapper } from "../../src";

describe('Decorate wrapper', function () {
  test('should decorate provider (injection based useWrapper) - function decorator case', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    const functionDecorator = {
      decorator(decoratee: TestService) { return decoratee.method() + 'bar' },
      inject: [Delegate()],
    } as any

    @Injectable()
    class Service {
      constructor(
        @Inject(Decorate(functionDecorator)) readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service) as Service;
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
      decorator(bar: string, decoratee: TestService) { return bar + decoratee.method() },
      inject: ['bar', Delegate()],
    } as any;

    @Injectable()
    class Service {
      constructor(
        @Inject(Decorate(functionDecorator)) readonly service: TestService,
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

    const service = injector.get(Service) as Service;
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
      decorator(service: AwesomeService, decoratee: TestService) { return decoratee.method() + 'bar' + service.addAwesome() },
      inject: [AwesomeService, Delegate()],
    } as any;

    const decorator2 = {
      decorator(value: string, exclamation: string) { return `(${value + exclamation})` },
      inject: [Delegate(), 'exclamation'],
    } as any;

    @Injectable()
    class Service {
      constructor(
        @Inject(Decorate(decorator2, Decorate(decorator1))) readonly service: TestService,
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

    const service = injector.get(Service) as Service;
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
        @Inject(Delegate()) public decoratee: any,
      ) {}

      method() {
        return this.decoratee.method() + 'bar' + this.exclamation;
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(Decorate(DecoratorService as any)) readonly service: TestService,
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

    const service = injector.get(Service) as Service;
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
      @Inject(Delegate())
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
        @Inject(Decorate(DecoratorService as any)) readonly service: TestService,
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

    const service = injector.get(Service) as Service;
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
        @Inject(Delegate()) public decoratee: any,
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
        @Inject(Delegate()) public decoratee: any,
      ) {}

      method() {
        return `(${this.decoratee.method() + this.exclamation})`
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(Decorate(DecoratorService2 as any, Decorate(DecoratorService1 as any))) readonly service: TestService,
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

    const service = injector.get(Service) as Service;
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
      decorator(decoratee: TestService) { return decoratee.method() + 'bar' },
      inject: [Delegate()]
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: TestService,
        useWrapper: Decorate(functionDecorator as any),
      }
    ]);

    const service = injector.get(Service) as Service;
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
      @Inject(Delegate())
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
        useWrapper: Decorate(DecoratorService as any),
      },
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]);

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(DecoratorService);
    expect((service.service as DecoratorService).decoratee).toBeInstanceOf(TestService);
    expect(service.service.method()).toEqual('foobar!');
  });

  test('should decorate provider with custom wrappers on delegate injection', function () {
    let called: boolean = false;
    const TestWrapper = createWrapper((_: never) => {
      return (injector, session, next) => {
        const value = next(injector, session);
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
      @Inject(TestWrapper(Delegate()))
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
        useWrapper: Decorate(DecoratorService as any),
      },
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]);

    const service = injector.get(Service) as Service;
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

      method(@Inject(Delegate()) decoratee?: TestService): string {
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
        useWrapper: Decorate(DecoratorService as any),
      },
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]);

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(DecoratorService);
    expect(service.service.method()).toEqual('foobar!');
  });

  test('should works in definition based useWrapper', function () {
    const injector = new Injector([
      {
        provide: 'test',
        useValue: 'foobar',
        useWrapper: Decorate({
          decorator(decoratee: string, exclamation: string) { return decoratee + exclamation; },
          inject: [Delegate(), 'exclamation'],
        }),
      },
      {
        provide: 'exclamation',
        useValue: '!',
      },
    ]);

    const t = injector.get('test') as string;
    expect(t).toEqual('foobar!');
  });

  test('Decorate wrapper should provides in absent use case - using Fallback wrapper', function () {
    class Service {}

    @Injectable()
    class DecoratorService {
      constructor(
        @Inject(Delegate()) readonly service: any,
      ) {}
    }

    const injector = new Injector([
      {
        provide: 'test',
        useValue: 'foobar'
      },
      {
        provide: Service,
        useWrapper: Fallback('test', Decorate(DecoratorService as any)),
      },
    ]);

    const service = injector.get(Service) as DecoratorService;
    expect(service).toEqual('foobar');
  });
});
