import { Injector, Injectable, Inject, createHook, Module } from "@adi/core";
import { Decorate, DecorateHookOptions, Delegate, Fallback } from "../../src";

describe('Decorate injection hook', function () {
  test('should decorate provider - injection based hook with function case', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    const functionDecorator: DecorateHookOptions = {
      decorate(decorated: TestService) { return decorated.method() + 'bar' },
    };

    @Injectable()
    class Service {
      constructor(
        @Inject([Decorate(functionDecorator)]) readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toEqual('foobar');
  });

  test('should decorate provider using additional injections - injection based hook with function case', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    const functionDecorator: DecorateHookOptions = {
      decorate(decorated: TestService, bar: string) { return bar + decorated.method() },
      inject: ['bar'],
    };

    @Injectable()
    class Service {
      constructor(
        @Inject([Decorate(functionDecorator)]) readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: 'bar',
        useValue: 'bar',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toEqual('barfoo');
  });

  test('should decorate provider using double decorator - injection based hook with function case', function () {
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

    const decorator1: DecorateHookOptions = {
      decorate(decorated: TestService, service: AwesomeService) { return decorated.method() + 'bar' + service.addAwesome() },
      inject: [AwesomeService],
    };

    const decorator2: DecorateHookOptions = {
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

    const injector = Injector.create([
      Service,
      TestService,
      AwesomeService,
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toEqual('(foobar is awesome!)');
  });

  test('should decorate provider - class decorator case with constructor injection', function () {
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
        @Inject([Delegate('decorate')]) public decorated: any,
      ) {}

      method() {
        return this.decorated.method() + 'bar' + this.exclamation;
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject([Decorate(DecoratorService)]) readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(DecoratorService);
    expect((service.service as DecoratorService).decorated).toBeInstanceOf(TestService);
    expect(service.service.method()).toEqual('foobar!');
  });

  test('should decorate provider - class decorator case with property injection', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    @Injectable()
    class DecoratorService implements TestService {
      @Inject([Delegate('decorate')])
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
        @Inject([Decorate(DecoratorService)]) readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(DecoratorService);
    expect((service.service as DecoratorService).decorated).toBeInstanceOf(TestService);
    expect(service.service.method()).toEqual('foobar!');
  });

  test('should decorate provider with double decorators - class decorator case', function () {
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
        @Inject([Delegate('decorate')]) public decorated: any,
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
        @Inject([Delegate('decorate')]) public decorated: any,
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

    const injector = Injector.create([
      Service,
      TestService,
      AwesomeService,
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(DecoratorService2);
    expect((service.service as DecoratorService2).decorated).toBeInstanceOf(DecoratorService1);
    expect(service.service.method()).toEqual('(foobar is awesome!)');
  });

  test('should decorate provider - provider based hook with function case', function () {
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

    const functionDecorator: DecorateHookOptions = {
      decorate(decorated: TestService) { return decorated.method() + 'bar' },
    }

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: TestService,
        hooks: [Decorate(functionDecorator)],
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toEqual('foobar');
  });

  test('should decorate provider - provider based hook with class case', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    @Injectable()
    class DecoratorService implements TestService {
      @Inject([Delegate('decorate')])
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

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: TestService,
        hooks: [Decorate(DecoratorService)],
      },
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(DecoratorService);
    expect((service.service as DecoratorService).decorated).toBeInstanceOf(TestService);
    expect(service.service.method()).toEqual('foobar!');
  });

  test('should decorate provider with custom hook on delegate injection', function () {
    let called: boolean = false;
    const TestHook = createHook(() => {
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
        TestHook(),
        Delegate('decorate'),
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

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: TestService,
        hooks: [Decorate(DecoratorService)],
      },
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
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

      method(@Inject([Delegate('decorate')]) decorated?: TestService): string {
        return decorated?.method() + 'bar' + this.exclamation;
      }
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: TestService,
        hooks: [Decorate(DecoratorService)],
      },
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(DecoratorService);
    expect(service.service.method()).toEqual('foobar!');
  });

  test('should works in definition based hook', function () {
    const injector = Injector.create([
      {
        provide: 'test',
        useValue: 'foobar',
        hooks: [
          Decorate({
            decorate(decoratee: string, exclamation: string) { return decoratee + exclamation; },
            inject: ['exclamation'],
          }),
        ],
      },
      {
        provide: 'exclamation',
        useValue: '!',
      },
    ]).init() as Injector;

    const t = injector.get('test') as string;
    expect(t).toEqual('foobar!');
  });

  test('should provides in absent use case - using Fallback hook', function () {
    class Service {}

    @Injectable()
    class DecoratorService {
      constructor(
        @Inject([Delegate('decorate')]) readonly service: any,
      ) {}
    }

    const injector = Injector.create([
      {
        provide: 'test',
        useValue: 'foobar'
      },
      {
        provide: Service,
        hooks: [
          Fallback('test'),
          Decorate(DecoratorService),
        ],
      },
    ]).init() as Injector;

    const service = injector.get(Service) as DecoratorService;
    expect(service).toEqual('foobar');
  });

  test('should decorate only once', function () {
    let calledTimes = 0;

    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    @Injectable()
    class DecoratorService implements TestService {
      @Inject([Delegate('decorate')])
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

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: TestService,
        hooks: [Decorate(DecoratorService)],
      },
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
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
      @Inject([Delegate('customKey')])
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
        @Inject([
          Decorate({
            useClass: DecoratorService,
            delegationKey: 'customKey',
          })
        ]) 
        readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: 'exclamation',
        useValue: '!',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(DecoratorService);
    expect((service.service as DecoratorService).decorated).toBeInstanceOf(TestService);
    expect(service.service.method()).toEqual('foobar!');
  });

  test('should work with parallel injection', async function() {
    @Injectable()
    class TestService {
      public calledTimes: number = 0;
      @Inject('useFactory') proto: TestService;
    }

    @Injectable()
    class Service {
      @Inject() propTestService1: TestService;
      @Inject() propTestService2: TestService;
      @Inject() propTestService3: TestService;
      @Inject() propTestService4: TestService;
      @Inject() propTestService5: TestService;
      @Inject() propTestService6: TestService;
      @Inject() propTestService7: TestService;
      @Inject() propTestService8: TestService;
      @Inject() propTestService9: TestService;
      @Inject() propTestService10: TestService;

      constructor(
        readonly testService1: TestService,
        readonly testService2: TestService,
        readonly testService3: TestService,
        readonly testService4: TestService,
        readonly testService5: TestService,
        readonly testService6: TestService,
        readonly testService7: TestService,
        readonly testService8: TestService,
        readonly testService9: TestService,
        readonly testService10: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: TestService,
        hooks: [
          Decorate({
            decorate(value: TestService) {
              value.calledTimes++;
              return value;
            },
          }),
        ],
      },
      {
        provide: 'useFactory',
        useFactory: async () => { return Object.create(TestService.prototype) },
      }
    ]).init() as Injector;
  
    const service = await injector.get(Service);

    expect(service).toBeInstanceOf(Service);
    expect(service.testService1).toBeInstanceOf(TestService);
    expect(service.testService2).toBeInstanceOf(TestService);
    expect(service.testService3).toBeInstanceOf(TestService);
    expect(service.testService4).toBeInstanceOf(TestService);
    expect(service.testService5).toBeInstanceOf(TestService);
    expect(service.testService6).toBeInstanceOf(TestService);
    expect(service.testService7).toBeInstanceOf(TestService);
    expect(service.testService8).toBeInstanceOf(TestService);
    expect(service.testService9).toBeInstanceOf(TestService);
    expect(service.testService10).toBeInstanceOf(TestService);

    expect(service.testService1 === service.testService2).toEqual(true);
    expect(service.testService1 === service.testService3).toEqual(true);
    expect(service.testService1 === service.testService4).toEqual(true);
    expect(service.testService1 === service.testService5).toEqual(true);
    expect(service.testService1 === service.testService6).toEqual(true);
    expect(service.testService1 === service.testService7).toEqual(true);
    expect(service.testService1 === service.testService8).toEqual(true);
    expect(service.testService1 === service.testService9).toEqual(true);
    expect(service.testService1 === service.testService10).toEqual(true);

    expect(service.testService1.proto === service.testService2.proto).toEqual(true);
    expect(service.testService1.proto === service.testService3.proto).toEqual(true);
    expect(service.testService1.proto === service.testService4.proto).toEqual(true);
    expect(service.testService1.proto === service.testService5.proto).toEqual(true);
    expect(service.testService1.proto === service.testService6.proto).toEqual(true);
    expect(service.testService1.proto === service.testService7.proto).toEqual(true);
    expect(service.testService1.proto === service.testService8.proto).toEqual(true);
    expect(service.testService1.proto === service.testService9.proto).toEqual(true);
    expect(service.testService1.proto === service.testService10.proto).toEqual(true);

    expect(service.propTestService1).toBeInstanceOf(TestService);
    expect(service.propTestService2).toBeInstanceOf(TestService);
    expect(service.propTestService3).toBeInstanceOf(TestService);
    expect(service.propTestService4).toBeInstanceOf(TestService);
    expect(service.propTestService5).toBeInstanceOf(TestService);
    expect(service.propTestService6).toBeInstanceOf(TestService);
    expect(service.propTestService7).toBeInstanceOf(TestService);
    expect(service.propTestService8).toBeInstanceOf(TestService);
    expect(service.propTestService9).toBeInstanceOf(TestService);
    expect(service.propTestService10).toBeInstanceOf(TestService);

    expect(service.testService1 === service.propTestService1).toEqual(true);
    expect(service.testService1 === service.propTestService2).toEqual(true);
    expect(service.testService1 === service.propTestService3).toEqual(true);
    expect(service.testService1 === service.propTestService4).toEqual(true);
    expect(service.testService1 === service.propTestService5).toEqual(true);
    expect(service.testService1 === service.propTestService6).toEqual(true);
    expect(service.testService1 === service.propTestService7).toEqual(true);
    expect(service.testService1 === service.propTestService8).toEqual(true);
    expect(service.testService1 === service.propTestService9).toEqual(true);
    expect(service.testService1 === service.propTestService10).toEqual(true);

    expect(service.testService1.proto === service.propTestService1.proto).toEqual(true);
    expect(service.testService1.proto === service.propTestService2.proto).toEqual(true);
    expect(service.testService1.proto === service.propTestService3.proto).toEqual(true);
    expect(service.testService1.proto === service.propTestService4.proto).toEqual(true);
    expect(service.testService1.proto === service.propTestService5.proto).toEqual(true);
    expect(service.testService1.proto === service.propTestService6.proto).toEqual(true);
    expect(service.testService1.proto === service.propTestService7.proto).toEqual(true);
    expect(service.testService1.proto === service.propTestService8.proto).toEqual(true);
    expect(service.testService1.proto === service.propTestService9.proto).toEqual(true);
    expect(service.testService1.proto === service.propTestService10.proto).toEqual(true);

    expect(service.testService1.calledTimes).toEqual(1);
  });
});
