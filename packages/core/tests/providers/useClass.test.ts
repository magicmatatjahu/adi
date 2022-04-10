import { Injector, Injectable, Inject, Token, SingletonScope, TransientScope } from "../../src";

describe('useClass', function() {
  test('should work without injection arguments', function() {
    @Injectable()
    class Service {}

    const injector = Injector.create([
      {
        provide: 'useClass',
        useClass: Service,
      },
    ]).init() as Injector;

    const resolvedToken = injector.get<Service>('useClass');
    expect(resolvedToken).toBeInstanceOf(Service);
  });

  test('should work with injection arguments', function() {
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

    const injector = Injector.create([
      HelperService,
      {
        provide: 'useClass',
        useClass: Service,
      },
    ]).init() as Injector;

    const resolvedToken = injector.get<Service>('useClass') as Service;
    expect(resolvedToken.service).toBeInstanceOf(HelperService);
    expect(resolvedToken.propService).toBeInstanceOf(HelperService);
  });

  test('should override scope', function() {
    @Injectable()
    class Service {}

    const injector = Injector.create([
      {
        provide: 'useClass',
        useClass: Service,
        scope: TransientScope,
      },
    ]).init() as Injector;

    const service1 = injector.get<Service>('useClass');
    const service2 = injector.get<Service>('useClass');
    expect(service1).toBeInstanceOf(Service);
    expect(service2).toBeInstanceOf(Service);
    expect(service1 === service2).toEqual(false);
  });

  test('should not override scope (Singleton case)', function() {
    @Injectable({
      scope: SingletonScope,
    })
    class Service {}

    const injector = Injector.create([
      {
        provide: 'useClass',
        useClass: Service,
        scope: TransientScope,
      },
    ]).init() as Injector;

    const service1 = injector.get<Service>('useClass');
    const service2 = injector.get<Service>('useClass');
    expect(service1).toBeInstanceOf(Service);
    expect(service2).toBeInstanceOf(Service);
    expect(service1 === service2).toEqual(true);
  });
});