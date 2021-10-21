import { Injector, Injectable, Inject, NewOptional, NewSelf } from "../../src";

describe('Self wrapper', function () {
  test('should inject service from self injector', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('useValue', NewSelf()) readonly useValue: string,
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

    const service = childInjector.newGet(Service);
    expect(service.useValue).toEqual('barfoo');
  });

  test('should inject service from self injector - not found case (use Optional wrapper to handle error from NilInjector)', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('useValue', [
          NewOptional(),
          NewSelf(),
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

    const service = childInjector.newGet(Service);
    expect(service.useValue).toEqual(undefined);
  });
});