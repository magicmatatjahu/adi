import { Injector, Inject, Injectable, Optional } from "@adi/core";

import { Self } from "../../src/hooks";

describe('Self wrapper', function () {
  test('should inject service from self injector', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('useValue', Self()) readonly useValue: string,
      ) {}
    }

    const parentInjector = new Injector([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
    ]);
    const childInjector = new Injector([
      Service,
      {
        provide: 'useValue',
        useValue: 'barfoo',
      },
    ], parentInjector);

    const service = childInjector.get(Service);
    expect(service.useValue).toEqual('barfoo');
  });

  test('should inject service from self injector - not found case (use Optional wrapper to handle error from NilInjector)', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('useValue', [
          Optional(),
          Self(),
        ]) 
        readonly useValue: string,
      ) {}
    }

    const parentInjector = new Injector([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
    ]);
    const childInjector = new Injector([
      Service,
    ], parentInjector);

    const service = childInjector.get(Service);
    expect(service.useValue).toEqual(undefined);
  });
});