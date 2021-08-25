import { Injector, Injectable, Inject, Optional, SkipSelf } from "../../src";

describe('SkipSelf wrapper', function () {
  test('should inject service from parent injector', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('useValue', SkipSelf()) readonly useValue: string,
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

    const service = childInjector.get(Service) ;
    expect(service.useValue).toEqual('foobar');
  });

  test('should inject service from parent injector - not found case (use Optional wrapper to handle error from NilInjector)', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('useValue', Optional(SkipSelf())) readonly useValue: string,
      ) {}
    }

    const parentInjector = new Injector();
    const childInjector = new Injector([
      Service,
      {
        provide: 'useValue',
        useValue: 'barfoo',
      },
    ], parentInjector);

    const service = childInjector.get(Service) ;
    expect(service.useValue).toEqual(undefined);
  });
});