import { Injector, Inject, Injectable } from "@adi/core";
import { Transform, TransformHookOptions } from "../../src";

describe('Transform injection hook', function () {
  test('should transform returned value - injection based hook', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    const transformer: TransformHookOptions = {
      transform(value: TestService) { return value.method() + 'bar' },
    };

    @Injectable()
    class Service {
      constructor(
        @Inject([Transform(transformer)]) readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toEqual('foobar');
  });

  test('should transform returned value using additional injections - injection based hook', function () {
    @Injectable()
    class TestService {
      method() {
        return 'foo';
      }
    }

    const transformer: TransformHookOptions = {
      transform(value: TestService, bar: string) { return bar + value.method() },
      inject: ['bar'],
    };

    @Injectable()
    class Service {
      constructor(
        @Inject([Transform(transformer)]) readonly service: TestService,
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

  test('should transform returned value using double transformer - injection based hook', function () {
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

    const transformer1: TransformHookOptions = {
      transform(decoratee: TestService, service: AwesomeService) { return decoratee.method() + 'bar' + service.addAwesome() },
      inject: [AwesomeService],
    }

    const transformer2: TransformHookOptions = {
      transform(value: string, exclamation: string) { return `(${value + exclamation})` },
      inject: ['exclamation'],
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

  test('should transform returned value - provider based hook', function () {
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

    const transformer: TransformHookOptions = {
      transform(value: TestService) { return value.method() + 'bar' },
    }

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: TestService,
        hooks: [Transform(transformer)],
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toEqual('foobar');
  });

  test('should works in definition based hook', function () {
    const injector = Injector.create([
      {
        provide: 'test',
        useValue: 'foobar',
        hooks: [
          Transform({
            transform(value: string, exclamation: string) { return value + exclamation; },
            inject: ['exclamation'],
          }),
        ]
      },
      {
        provide: 'exclamation',
        useValue: '!',
      },
    ]).init() as Injector;

    const t = injector.get('test') as string;
    expect(t).toEqual('foobar!');
  });
});