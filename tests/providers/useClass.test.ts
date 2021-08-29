import { Injector, Injectable, Inject, Scope, Token } from "../../src";

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

  test('should have possibility to inject custom injections', function() {
    @Injectable()
    class Service {
      property: string;

      constructor(
        readonly parameter: string,
      ) {}

      method(argument?: string) {
        return argument;
      }
    }

    const injector = new Injector([
      {
        provide: 'parameter',
        useValue: 'parameter injection',
      },
      {
        provide: 'property',
        useValue: 'property injection',
      },
      {
        provide: 'argument',
        useValue: 'argument injection',
      },
      {
        provide: 'useClass',
        useClass: Service,
        inject: {
          parameters: [Token('parameter')],
          properties: {
            property: 'property',
          },
          methods: {
            method: [Token('argument')],
          }
        }
      },
    ]);

    const service = injector.get<Service>('useClass');
    expect(service).toBeInstanceOf(Service);
    expect(service.parameter).toEqual('parameter injection');
    expect(service.property).toEqual('property injection');
    expect(service.method()).toEqual('argument injection');
  });

  test('should have possibility to inject custom constructor injections', function() {
    @Injectable()
    class HelperService {}

    @Injectable()
    class Service {
      @Inject() property: HelperService;

      constructor(
        readonly service: HelperService,
        readonly parameter: HelperService,
      ) {}
    }

    const injector = new Injector([
      {
        provide: 'parameter',
        useValue: 'parameter injection',
      },
      HelperService,
      {
        provide: 'useClass',
        useClass: Service,
        inject: [undefined, Token('parameter')],
      },
    ]);

    const service = injector.get<Service>('useClass');
    const helpService = injector.get(HelperService);
    expect(service).toBeInstanceOf(Service);
    expect(service.service).toBeInstanceOf(HelperService);
    expect(service.service).toEqual(helpService);
    expect(service.parameter).toEqual('parameter injection');
    expect(service.property).toEqual(helpService);
    expect(service.property).toBeInstanceOf(HelperService);
  });

  test('should have possibility to override injection by custom injections', function() {
    @Injectable()
    class HelperService {}

    @Injectable()
    class Service {
      @Inject() property: HelperService;
      @Inject() propertyService: HelperService;

      constructor(
        readonly service: HelperService,
        readonly parameter: HelperService,
      ) {}

      @Inject()
      method(service?: HelperService, argument?: HelperService) {
        return [service, argument];
      }
    }

    const injector = new Injector([
      {
        provide: 'parameter',
        useValue: 'parameter injection',
      },
      {
        provide: 'property',
        useValue: 'property injection',
      },
      {
        provide: 'argument',
        useValue: 'argument injection',
      },
      HelperService,
      {
        provide: 'useClass',
        useClass: Service,
        inject: {
          parameters: [undefined, Token('parameter')],
          properties: {
            property: 'property',
          },
          methods: {
            method: [undefined, Token('argument')],
          }
        }
      },
    ]);

    const service = injector.get<Service>('useClass');
    const helpService = injector.get(HelperService);
    expect(service).toBeInstanceOf(Service);
    expect(service.service).toBeInstanceOf(HelperService);
    expect(service.service).toEqual(helpService);
    expect(service.parameter).toEqual('parameter injection');
    expect(service.propertyService).toEqual(helpService);
    expect(service.propertyService).toBeInstanceOf(HelperService);
    expect(service.property).toEqual('property injection');
    const args = service.method();
    expect(args[0]).toEqual(helpService);
    expect(args[0]).toBeInstanceOf(HelperService);
    expect(args[1]).toEqual('argument injection');
  });

  test('should have possibility to inject custom injections by "dynamic" function', function() {
    @Injectable()
    class HelperService {}

    @Injectable()
    class Service {
      @Inject() property: string;
      @Inject() propertyService: HelperService;

      constructor(
        readonly service: HelperService,
        readonly parameter: string,
      ) {}

      @Inject()
      method(service?: HelperService, argument?: string) {
        return [service, argument];
      }
    }
    const injector = new Injector([
      {
        provide: 'parameter',
        useValue: 'parameter injection',
      },
      {
        provide: 'property',
        useValue: 'property injection',
      },
      {
        provide: 'argument',
        useValue: 'argument injection',
      },
      HelperService,
      {
        provide: 'useClass',
        useClass: Service,
        inject: {
          dynamic(arg) {
            const { propertyKey, index } = arg.metadata;
            // constructor injection
            if (!propertyKey && index === 1) {
              return 'parameter';
            }
            // property injection
            if (propertyKey === 'property') {
              return 'property';
            }
            // method injection
            if (propertyKey === 'method' && index === 1) {
              return 'argument';
            }
          }
        }
      },
    ]);

    const service = injector.get<Service>('useClass');
    const helpService = injector.get(HelperService);
    expect(service).toBeInstanceOf(Service);
    expect(service.service).toBeInstanceOf(HelperService);
    expect(service.service).toEqual(helpService);
    expect(service.parameter).toEqual('parameter injection');
    expect(service.propertyService).toEqual(helpService);
    expect(service.propertyService).toBeInstanceOf(HelperService);
    expect(service.property).toEqual('property injection');
    const args = service.method();
    expect(args[0]).toEqual(helpService);
    expect(args[0]).toBeInstanceOf(HelperService);
    expect(args[1]).toEqual('argument injection');
  });

  test('should have possibility to inject custom injections by "dynamic" function - case with plain injections', function() {
    @Injectable()
    class HelperService {}

    @Injectable()
    class Service {
      @Inject() property: string;
      @Inject() propertyService: HelperService;

      constructor(
        readonly service: HelperService,
        readonly parameter: string,
      ) {}

      @Inject()
      method(service?: HelperService, argument?: string) {
        return [service, argument];
      }
    }
    const injector = new Injector([
      {
        provide: 'parameter',
        useValue: 'parameter injection',
      },
      {
        provide: 'property',
        useValue: 'property injection',
      },
      {
        provide: 'argument',
        useValue: 'argument injection',
      },
      HelperService,
      {
        provide: 'useClass',
        useClass: Service,
        inject: {
          parameters: [undefined, HelperService],
          properties: {
            property: HelperService,
          },
          methods: {
            method: [undefined, HelperService],
          },
          dynamic(arg) {
            const { propertyKey, index } = arg.metadata;
            // constructor injection
            if (!propertyKey && index === 1) {
              return 'parameter';
            }
            // property injection
            if (propertyKey === 'property') {
              return 'property';
            }
            // method injection
            if (propertyKey === 'method' && index === 1) {
              return 'argument';
            }
          }
        }
      },
    ]);

    const service = injector.get<Service>('useClass');
    const helpService = injector.get(HelperService);
    expect(service).toBeInstanceOf(Service);
    expect(service.service).toBeInstanceOf(HelperService);
    expect(service.service).toEqual(helpService);
    expect(service.parameter).toBeInstanceOf(HelperService);
    expect(service.parameter).toEqual(helpService);
    expect(service.propertyService).toEqual(helpService);
    expect(service.propertyService).toBeInstanceOf(HelperService);
    expect(service.property).toBeInstanceOf(HelperService);
    expect(service.property).toEqual(helpService);
    const args = service.method();
    expect(args[0]).toEqual(helpService);
    expect(args[0]).toBeInstanceOf(HelperService);
    expect(args[1]).toEqual(helpService);
    expect(args[1]).toBeInstanceOf(HelperService);
  });
});
