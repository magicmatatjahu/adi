import { Injector, Injectable, Inject, Decorate, createWrapper } from "../../src";

describe('Decorate wrapper', function () {
  test('should decorate provider (injection based useWrapper) - function decorator case', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    const functionDecorator = {
      decorator(decoratee: TestService) { return decoratee.method() + 'bar' }
    }

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

  test('should decorate provider (injection based useWrapper) - function decorator case with inject array', function () {
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

    const functionDecorator = {
      decorator(decoratee: TestService, service: AwesomeService, exclamation: string) { return decoratee.method() + 'bar' + service.addAwesome() + exclamation },
      inject: [AwesomeService, 'exclamation'],
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(Decorate(functionDecorator)) readonly service: TestService,
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
    expect(service.service).toEqual('foobar is awesome!');
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
      decorator(decoratee: TestService, service: AwesomeService) { return decoratee.method() + 'bar' + service.addAwesome() },
      inject: [AwesomeService],
    }

    const decorator2 = {
      decorator(value: string, exclamation: string) { return `(${value + exclamation})` },
      inject: ['exclamation'],
    }

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
        public decoratee: TestService,
      ) {}

      method() {
        return this.decoratee.method() + 'bar' + this.exclamation;
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(Decorate(DecoratorService)) readonly service: TestService,
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
      @Inject()
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
        @Inject(Decorate(DecoratorService)) readonly service: TestService,
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
        public service: AwesomeService,
        public decoratee: TestService,
      ) {}

      method() {
        return this.decoratee.method() + 'bar' + this.service.addAwesome();
      }
    }

    @Injectable()
    class DecoratorService2 implements TestService {
      constructor(
        @Inject('exclamation') readonly exclamation: string,
        public decoratee: TestService,
      ) {}

      method() {
        return `(${this.decoratee.method() + this.exclamation})`
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(Decorate(DecoratorService2, Decorate(DecoratorService1))) readonly service: TestService,
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
      decorator(decoratee: TestService) { return decoratee.method() + 'bar' }
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: TestService,
        useWrapper: Decorate(functionDecorator),
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
      @Inject()
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
        useWrapper: Decorate(DecoratorService),
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

  test('should decorate provider with custom wrappers on decoratee injection', function () {
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
      @Inject(TestWrapper())
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
        useWrapper: Decorate(DecoratorService),
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
});
