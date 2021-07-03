import { Injector, Injectable, Inject, Multi, Named, c } from "../../src";

describe('Multi wrapper', function () {
  test('should inject multi providers when wrapper is defined as normal provider in providers array', function () {
    @Injectable()
    class MultiProvider extends Array<any> {}

    @Injectable()
    class Service {
      constructor(
        @Inject() readonly multi: MultiProvider,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: MultiProvider,
        useWrapper: Multi(),
      },
      {
        provide: MultiProvider,
        useValue: 'multi-provider-1'
      },
      {
        provide: MultiProvider,
        useValue: 'multi-provider-2'
      },
      {
        provide: MultiProvider,
        useValue: 'multi-provider-3'
      },
    ]);

    const service = injector.get(Service) as Service;
    expect(service.multi).toEqual(['multi-provider-1', 'multi-provider-2', 'multi-provider-3']);
  });

  test('should inject multi providers from given token with constraints (token based useWrapper)', function () {
    @Injectable()
    class MultiProvider extends Array<any> {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Named('multi')) readonly multi: MultiProvider,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: MultiProvider,
        useWrapper: Multi(),
      },
      {
        provide: MultiProvider,
        useValue: 'multi1',
        when: c.named('multi'),
      },
      {
        provide: MultiProvider,
        useValue: 'multi2',
      },
      {
        provide: MultiProvider,
        useValue: 'multi3',
        when: c.named('multi'),
      }
    ]);

    const service = injector.get(Service) as Service;
    expect(service.multi).toEqual(['multi1', 'multi3']);
  });

  test('should inject multi providers from given token with constraints (injection based useWrapper)', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', Multi(Named('multi'))) readonly multi: Array<any>,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: 'token',
        useValue: 'no-multi'
      },
      {
        provide: 'token',
        useValue: 'multi1',
        when: c.named('multi'),
      },
      {
        provide: 'token',
        useValue: 'multi2',
        when: c.named('multi'),
      },
      {
        provide: 'token',
        useValue: 'multi3',
      }
    ]);

    const service = injector.get(Service) as Service;
    expect(service.multi).toEqual(['multi1', 'multi2']);
  });

  // TODO: Add more testing with side effects etc
});