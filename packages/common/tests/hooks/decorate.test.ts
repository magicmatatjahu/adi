import { Injector, Injectable, Inject, createWrapper, Module } from "@adi/core";

import { Decorate, Delegate, Fallback, DecorateOptions } from "../../src/hooks";

describe('Decorate wrapper', function () {
  test('should decorate provider (injection based useWrapper) - function decorator case', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    const functionDecorator = {
      decorate(decorated: TestService) { return decorated.method() + 'bar' },
    };

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

    const service = injector.get(Service);
    expect(service.service).toEqual('foobar');
  });

  test('should decorate provider (injection based useWrapper) - function decorator case', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    const functionDecorator: DecorateOptions = {
      decorate(decorated: TestService, bar: string) { return bar + decorated.method() },
      inject: ['bar'],
    };

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

    const service = injector.get(Service);
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

    const decorator1: DecorateOptions = {
      decorate(decorated: TestService, service: AwesomeService) { return decorated.method() + 'bar' + service.addAwesome() },
      inject: [AwesomeService],
    };

    const decorator2 = {
      decorate(value: string, exclamation: string) { return `(${value + exclamation})` },
      inject: ['exclamation'],
    };

    @Injectable()
    class Service {
      constructor(
        @Inject([
          Decorate(decorator2), 
          Decorate(decorator1),
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

    const service = injector.get(Service);
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
        @Inject(Delegate('decorated')) public decorated: any,
      ) {}

      method() {
        return this.decorated.method() + 'bar' + this.exclamation;
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

    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(DecoratorService);
    expect((service.service as DecoratorService).decorated).toBeInstanceOf(TestService);
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
      @Inject(Delegate('decorated'))
      public decorated: any;

      constructor(
        @Inject('exclamation') readonly exclamation: string,
      ) {}

      method() {
        return this.decorated.method() + 'bar' + this.exclamation;
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

    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(DecoratorService);
    expect((service.service as DecoratorService).decorated).toBeInstanceOf(TestService);
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
        @Inject(Delegate('decorated')) public decorated: any,
        public service: AwesomeService,
      ) {}

      method() {
        return this.decorated.method() + 'bar' + this.service.addAwesome();
      }
    }

    @Injectable()
    class DecoratorService2 implements TestService {
      constructor(
        @Inject('exclamation') readonly exclamation: string,
        @Inject(Delegate('decorated')) public decorated: any,
      ) {}

      method() {
        return `(${this.decorated.method() + this.exclamation})`
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject([
          Decorate(DecoratorService2), 
          Decorate(DecoratorService1)
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

    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(DecoratorService2);
    expect((service.service as DecoratorService2).decorated).toBeInstanceOf(DecoratorService1);
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
      decorate(decorated: TestService) { return decorated.method() + 'bar' },
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: TestService,
        useWrapper: Decorate(functionDecorator),
      }
    ]);

    const service = injector.get(Service);
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
      @Inject(Delegate('decorated'))
      public decorated: TestService;

      constructor(
        @Inject('exclamation') readonly exclamation: string,
      ) {}

      method() {
        return this.decorated.method() + 'bar' + this.exclamation;
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

    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(DecoratorService);
    expect((service.service as DecoratorService).decorated).toBeInstanceOf(TestService);
    expect(service.service.method()).toEqual('foobar!');
  });

  test('should decorate provider with custom wrappers on delegate injection', function () {
    let called: boolean = false;
    const TestWrapper = createWrapper(() => {
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
        Delegate('decorated'),
      ])
      public decorated: TestService;

      constructor(
        @Inject('exclamation') readonly exclamation: string,
      ) {}

      method() {
        return this.decorated.method() + 'bar' + this.exclamation;
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

    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(DecoratorService);
    expect((service.service as DecoratorService).decorated).toBeInstanceOf(TestService);
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

      method(@Inject(Delegate('decorated')) decorated?: TestService): string {
        return decorated?.method() + 'bar' + this.exclamation;
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

    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(DecoratorService);
    expect(service.service.method()).toEqual('foobar!');
  });

  test('should works in definition based useWrapper', function () {
    const injector = new Injector([
      {
        provide: 'test',
        useValue: 'foobar',
        useWrapper: Decorate({
          decorate(decoratee: string, exclamation: string) { return decoratee + exclamation; },
          inject: ['exclamation'],
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
        @Inject(Delegate('decorated')) readonly service: any,
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
          Fallback('test'),
          Decorate(DecoratorService),
        ],
      },
    ]);

    const service = injector.get(Service) as DecoratorService;
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
      @Inject(Delegate('decorated'))
      public decorated: TestService;

      constructor(
        @Inject('exclamation') readonly exclamation: string,
      ) {
        calledTimes++;
      }

      method() {
        return this.decorated.method() + 'bar' + this.exclamation;
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
        useWrapper: Decorate(DecoratorService),
      },
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]);

    const service = injector.get(Service);
    expect(service.service1).toBeInstanceOf(DecoratorService);
    expect((service.service1 as DecoratorService).decorated).toBeInstanceOf(TestService);
    expect(service.service1.method()).toEqual('foobar!');
    expect(service.service1 === service.service2).toEqual(true);
    expect(calledTimes).toEqual(1);
  });

  test('should be possible to set custom delegation key', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    @Injectable()
    class DecoratorService implements TestService {
      @Inject(Delegate('customKey'))
      public decorated: any;

      constructor(
        @Inject('exclamation') readonly exclamation: string,
      ) {}

      method() {
        return this.decorated.method() + 'bar' + this.exclamation;
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(Decorate({
          useClass: DecoratorService,
          delegationKey: 'customKey',
        })) readonly service: TestService,
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

    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(DecoratorService);
    expect((service.service as DecoratorService).decorated).toBeInstanceOf(TestService);
    expect(service.service.method()).toEqual('foobar!');
  });

  test('should decorate by wrapper from imported module', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    const functionDecorator = {
      decorate(decorated: TestService) { return decorated.method() + 'bar' },
    };

    @Injectable()
    class Service {
      constructor(
        @Inject() readonly service: TestService,
      ) {}
    }

    @Module({
      providers: [
        {
          provide: TestService,
          useWrapper: Decorate(functionDecorator),
        }
      ],
      exports: [
        TestService,
      ]
    })
    class ChildModule {}

    @Module({
      imports: [
        ChildModule,
      ],
      providers: [
        Service,
        TestService,
      ],
    })
    class ParentModule {}

    const injector = Injector.create(ParentModule).build();

    const service = injector.get(Service);
    expect(service.service).toEqual('foobar');
  });
});
