import { Injector, Injectable, Inject, Optional, Module, Token, Ref } from "@adi/core"
import { SkipSelf } from "../../src/hooks";

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
    ]).init() as Injector;
    const childInjector = Injector.create([
      Service,
      {
        provide: 'useValue',
        useValue: 'barfoo',
      },
    ], undefined, parentInjector).init() as Injector;

    const service = childInjector.get(Service) as Service;
    expect(service.useValue).toEqual('foobar');
  });

  test('should inject service from parent injector - not found case (use Optional hook to handle error from NilInjector)', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('useValue', [
          Optional(),
          SkipSelf(),
        ])
        readonly useValue: string,
      ) {}
    }

    const parentInjector = Injector.create().init() as Injector;
    const childInjector = Injector.create([
      Service,
      {
        provide: 'useValue',
        useValue: 'barfoo',
      },
    ], undefined, parentInjector).init() as Injector;

    const service = childInjector.get(Service) as Service;
    expect(service.useValue).toEqual(undefined);
  });
});
