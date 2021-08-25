import { Injector, Injectable, Inject, Scope } from "../../src";

describe('useClass', function() {
  test('should works without injection arguments', function() {
    @Injectable()
    class Service {}

    const injector = new Injector([
      {
        provide: 'useClass',
        useClass: Service,
      },
    ]);

    const resolvedToken = injector.get<Service>('useClass');
    expect(resolvedToken).toBeInstanceOf(Service);
  });

  test('should works with injection arguments', function() {
    @Injectable()
    class HelperService {}

    @Injectable()
    class Service {
      @Inject()
      readonly propService: HelperService;

      constructor(
        readonly service: HelperService,
      ) {}
    }

    const injector = new Injector([
      HelperService,
      {
        provide: 'useClass',
        useClass: Service,
      },
    ]);

    const resolvedToken = injector.get<Service>('useClass');
    expect(resolvedToken.service).toBeInstanceOf(HelperService);
    expect(resolvedToken.propService).toBeInstanceOf(HelperService);
  });

  test('should overrides scope', function() {
    @Injectable()
    class Service {}

    const injector = new Injector([
      {
        provide: 'useClass',
        useClass: Service,
        scope: Scope.TRANSIENT,
      },
    ]);

    const service1 = injector.get<Service>('useClass');
    const service2 = injector.get<Service>('useClass');
    expect(service1).toBeInstanceOf(Service);
    expect(service2).toBeInstanceOf(Service);
    expect(service1 === service2).toEqual(false);
  });

  test('should not overrides scope (Singleton case)', function() {
    @Injectable({
      scope: Scope.SINGLETON,
    })
    class Service {}

    const injector = new Injector([
      {
        provide: 'useClass',
        useClass: Service,
        scope: Scope.TRANSIENT,
      },
    ]);

    const service1 = injector.get<Service>('useClass');
    const service2 = injector.get<Service>('useClass');
    expect(service1).toBeInstanceOf(Service);
    expect(service2).toBeInstanceOf(Service);
    expect(service1 === service2).toEqual(true);
  });
});