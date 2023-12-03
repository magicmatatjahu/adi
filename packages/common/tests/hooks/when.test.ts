import { Injector, Injectable, Inject } from "@adi/core";

import { When } from "../../src/hooks/when";
import { Value } from "../../src/hooks/value";

describe('When injection hook', function () {
  test('should use proper hooks based on condition', function () {
    @Injectable()
    class TestService {
      constructor(
        @Inject('string-token') 
        readonly value: object,
      ) {}

      method() {
        return 'foo';
      }
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject('string-token') 
        readonly value: string,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: 'string-token',
        useValue: {
          foo: 'bar',
          bar: 'foo'
        },
        hooks: When({
          when: session => session.parent?.token === Service,
          then: use => use(Value('foo')),
          otherwise: use => use(Value('bar')),
        })
      }
    ])

    const service = injector.getSync(Service)
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.value).toEqual('bar');
    expect(service.service.value).toEqual('foo');
  });

  test('should skip new hooks when condition is not meet - inject with old flow', function () {
    @Injectable()
    class TestService {
      constructor(
        @Inject('string-token') 
        readonly value: object,
      ) {}

      method() {
        return 'foo';
      }
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject('string-token') 
        readonly value: string,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: 'string-token',
        useValue: {
          foo: 'bar',
          bar: 'foo'
        },
        hooks: When({
          when: () => false,
          then: use => use(Value('foo')),
        })
      }
    ])

    const service = injector.getSync(Service)
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.value).toEqual({ foo: 'bar', bar: 'foo' });
    expect(service.service.value).toEqual({ foo: 'bar', bar: 'foo' });
  });
});
