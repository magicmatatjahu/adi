import { Injector, Injectable, Inject, Multi, Named, when, InjectionToken } from "../../src";

describe('Multi wrapper', function () {
  test('should inject multi providers - token based useWrapper', function () {
    @Injectable()
    class MultiProvider extends Array<string> {}

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

  test('should inject multi providers - injection based useWrapper', function () {
    @Injectable()
    class MultiProvider extends Array<string> {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Multi()) readonly multi: MultiProvider,
      ) {}
    }

    const injector = new Injector([
      Service,
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

  test('should inject multi providers from given token with constraints - token based useWrapper', function () {
    @Injectable()
    class MultiProvider extends Array<string> {}

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
        when: when.named('multi'),
      },
      {
        provide: MultiProvider,
        useValue: 'multi2',
      },
      {
        provide: MultiProvider,
        useValue: 'multi3',
        when: when.named('multi'),
      }
    ]);

    const service = injector.get(Service) as Service;
    expect(service.multi).toEqual(['multi1', 'multi3']);
  });

  test('should inject multi providers from given token with constraints - injection based useWrapper', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', Multi(Named('multi'))) readonly multi: Array<string>,
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
        when: when.named('multi'),
      },
      {
        provide: 'token',
        useValue: 'multi2',
        when: when.named('multi'),
      },
      {
        provide: 'token',
        useValue: 'multi3',
      }
    ]);

    const service = injector.get(Service) as Service;
    expect(service.multi).toEqual(['multi1', 'multi2']);
  });

  test.skip('should inject multi providers - tree-shakable token based useWrapper', function () {
    @Injectable({
      useWrapper: Multi()
    })
    class MultiProvider extends Array<string> {}

    @Injectable()
    class Service {
      constructor(
        readonly multi: MultiProvider,
      ) {}
    }

    const injector = new Injector([
      Service,
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

  test.skip('should inject multi providers - tree-shakable (injection token) token based useWrapper', function () {
    const MultiProvider = new InjectionToken({
      useWrapper: Multi(),
    });

    @Injectable()
    class Service {
      constructor(
        @Inject(MultiProvider) readonly multi: Array<string>,
      ) {}
    }

    const injector = new Injector([
      Service,
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

  // TODO: Add more testing with side effects etc
});