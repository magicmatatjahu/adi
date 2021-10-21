import { Injector, Injectable, Inject, Delegate, Transform } from "../../src";

describe('Transform wrapper', function () {
  test('should transform returned value (injection based useWrapper)', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    const transformer = {
      transform(value: TestService) { return value.method() + 'bar' },
      inject: [Delegate()],
    };

    @Injectable()
    class Service {
      constructor(
        @Inject(Transform(transformer)) readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service);
    expect(service.service).toEqual('foobar');
  });

  test('should transform returned value (injection based useWrapper) - case with Delegate wrapper as second argument in inject array', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    const transformer = {
      transform(bar: string, value: TestService) { return bar + value.method() },
      inject: ['bar', Delegate()],
    };

    @Injectable()
    class Service {
      constructor(
        @Inject(Transform(transformer)) readonly service: TestService,
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

  test('should transform returned value (injection based useWrapper) - double decorator', function () {
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

    const transformer1 = {
      transform(service: AwesomeService, decoratee: TestService) { return decoratee.method() + 'bar' + service.addAwesome() },
      inject: [AwesomeService, Delegate()],
    }

    const transformer2 = {
      transform(value: string, exclamation: string) { return `(${value + exclamation})` },
      inject: [Delegate(), 'exclamation'],
    }

    @Injectable()
    class Service {
      constructor(
        @Inject([
          Transform(transformer2),
          Transform(transformer1),
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

  test('should transform returned value (provider based useWrapper)', function () {
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

    const transformer = {
      transform(value: TestService) { return value.method() + 'bar' },
      inject: [Delegate()]
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: TestService,
        useWrapper: Transform(transformer),
      }
    ]);

    const service = injector.get(Service);
    expect(service.service).toEqual('foobar');
  });

  test('should works in definition based useWrapper', function () {
    const injector = new Injector([
      {
        provide: 'test',
        useValue: 'foobar',
        useWrapper: Transform({
          transform(value: string, exclamation: string) { return value + exclamation; },
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

  test('should work without inject array', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    const transformer = {
      transform(value: TestService) { return value.method() + 'bar' },
    };

    @Injectable()
    class Service {
      constructor(
        @Inject(Transform(transformer)) readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service);
    expect(service.service).toEqual('foobar');
  });
});
