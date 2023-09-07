import { Injector, Injectable, Inject, Optional } from "@adi/core"

import { SkipSelf } from "../../src/hooks/skip-self";

describe('SkipSelf injection hook', function () {
  test('should inject service from parent injector', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('useValue', SkipSelf()) readonly useValue: string,
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

    const service = childInjector.getSync(Service);
    expect(service.useValue).toEqual('foobar');
  });

  test('should inject service from parent injector - not found case (use Optional hook to handle error from NilInjector)', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('useValue', Optional(), SkipSelf())
        readonly useValue: string,
      ) {}
    }

    const parentInjector = Injector.create()
    const childInjector = Injector.create([
      Service,
      {
        provide: 'useValue',
        useValue: 'barfoo',
      },
    ], parentInjector)

    const service = childInjector.getSync(Service)
    expect(service.useValue).toEqual(undefined);
  });
});
