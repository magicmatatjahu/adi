import { Injector, Inject, Injectable, Optional } from "@adi/core";

import { Self } from "../../src/hooks/self";

describe('Self injection hook', function () {
  test('should inject service from self injector', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('useValue', Self()) readonly useValue: string,
      ) {}
    }

    const parentInjector = Injector.create([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
    ])
    const childInjector = Injector.create([
      Service,
      {
        provide: 'useValue',
        useValue: 'barfoo',
      },
    ], parentInjector)

    const service = childInjector.getSync(Service)
    expect(service.useValue).toEqual('barfoo');
  });

  test('should inject service from self injector - not found case (use Optional hook to handle error from NilInjector)', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('useValue', Optional(), Self()) 
        readonly useValue: string,
      ) {}
    }

    const parentInjector = Injector.create([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
    ])
    const childInjector = Injector.create([
      Service,
    ], parentInjector)

    const service = childInjector.getSync(Service)
    expect(service.useValue).toEqual(undefined);
  });
});