import { Injector, Inject, Injectable, WithDependencies, Token } from "../../src";

describe('WithDependencies wrapper', function () {
  test('should have possibility to inject custom injections', function() {
    const customInjections = {
      parameters: [Token('parameter')],
      properties: {
        property: 'property',
      },
      methods: {
        method: [Token('argument')],
      }
    };

    class TestService {
      property: string;

      constructor(
        readonly parameter: string,
      ) {}

      method(argument?: string) {
        return argument;
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(WithDependencies(customInjections)) readonly testService: TestService,
      ) {}
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
      Service,
      TestService,
    ]);

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService.parameter).toEqual('parameter injection');
    expect(service.testService.property).toEqual('property injection');
    expect(service.testService.method()).toEqual('argument injection');
  });

  test('should have possibility to inject custom constructor injections', function() {
    const customInjections = [undefined, 'parameter'];

    @Injectable()
    class HelperService {}

    @Injectable()
    class TestService {
      @Inject() property: HelperService;

      constructor(
        readonly service: HelperService,
        readonly parameter: HelperService,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(WithDependencies(customInjections)) readonly testService: TestService,
      ) {}
    }

    const injector = new Injector([
      {
        provide: 'parameter',
        useValue: 'parameter injection',
      },
      HelperService,
      TestService,
      Service,
    ]);

    const service = injector.get(Service);
    const helpService = injector.get(HelperService);
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService.service).toBeInstanceOf(HelperService);
    expect(service.testService.service).toEqual(helpService);
    expect(service.testService.parameter).toEqual('parameter injection');
    expect(service.testService.property).toBeInstanceOf(HelperService);
    expect(service.testService.property).toEqual(helpService);
  });

  test('should have possibility to inject custom factory injections', function() {
    const customInjections = [undefined, 'custom'];

    @Injectable()
    class HelperService {}

    @Injectable()
    class Service {
      constructor(
        @Inject('foobar', WithDependencies(customInjections)) readonly foobar: [HelperService, string],
      ) {}
    }

    const injector = new Injector([
      {
        provide: 'custom',
        useValue: 'custom injection',
      },
      {
        provide: 'normal',
        useValue: 'normal injection',
      },
      {
        provide: 'foobar',
        useFactory: (...args: any[]) => args,
        inject: [HelperService, 'normal']
      },
      HelperService,
      Service,
    ]);

    const service = injector.get(Service);
    const helpService = injector.get(HelperService);
    expect(service).toBeInstanceOf(Service);
    expect(service.foobar).toBeInstanceOf(Array);
    expect(service.foobar[0]).toBeInstanceOf(HelperService);
    expect(service.foobar[1]).toEqual('custom injection');
  });

  test('should have possibility to override injection by custom injections', function() {
    const customInjections = {
      parameters: [undefined, Token('parameter')],
      properties: {
        property: 'property',
      },
      methods: {
        method: [undefined, Token('argument')],
      }
    };

    @Injectable()
    class HelperService {}

    @Injectable()
    class TestService {
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

    @Injectable()
    class Service {
      constructor(
        @Inject(WithDependencies(customInjections)) readonly testService: TestService,
      ) {}
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
      TestService,
      Service,
    ]);

    const service = injector.get(Service);
    const helpService = injector.get(HelperService);
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(service.testService.service).toBeInstanceOf(HelperService);
    expect(service.testService.service).toEqual(helpService);
    expect(service.testService.parameter).toEqual('parameter injection');
    expect(service.testService.propertyService).toEqual(helpService);
    expect(service.testService.propertyService).toBeInstanceOf(HelperService);
    expect(service.testService.property).toEqual('property injection');
    const args = service.testService.method();
    expect(args[0]).toEqual(helpService);
    expect(args[0]).toBeInstanceOf(HelperService);
    expect(args[1]).toEqual('argument injection');
  });
});
