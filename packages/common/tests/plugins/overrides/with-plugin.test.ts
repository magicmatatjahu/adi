import { ADI, Injector, Injectable, Inject, Token, TransientScope } from "@adi/core";
import { Override, Portal, overridesPlugin } from "../../../src";

describe('Overrides plugin with Override injection hook', function () {
  const plugin = overridesPlugin({ overrides: true, portal: true });

  beforeAll(() => {
    ADI.use(plugin);
  });

  beforeAll(() => {
    ADI.destroy(plugin);
  });

  describe('Override injection hook', function() {
    test('should work', function () {
      const overrides = {
        parameters: [Token('parameter')],
        properties: {
          property: 'property',
        },
        methods: {
          method: [Token('argument')],
        }
      };
  
      @Injectable()
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
          @Inject(Override(overrides)) readonly testService: TestService,
        ) {}
      }
  
      const injector = Injector.create([
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
          provide: String,
          useValue: 'string',
        },
        Service,
        TestService,
      ]).init() as Injector;
  
      const service = injector.get(Service) as Service;
      expect(service).toBeInstanceOf(Service);
      expect(service.testService).toBeInstanceOf(TestService);
      expect(service.testService.parameter).toEqual('parameter injection');
      expect(service.testService.property).toEqual('property injection');
      expect(service.testService.method()).toEqual('argument injection');
    });
  
    test('should have possibility to inject custom constructor injections', function() {
      const overrides = [undefined, 'parameter'];
  
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
          @Inject(Override(overrides)) readonly testService: TestService,
        ) {}
      }
  
      const injector = Injector.create([
        {
          provide: 'parameter',
          useValue: 'parameter injection',
        },
        HelperService,
        TestService,
        Service,
      ]).init() as Injector;
  
      const service = injector.get(Service) as Service;
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
      const overrides = [undefined, 'custom'];
  
      @Injectable()
      class HelperService {}
  
      @Injectable()
      class Service {
        constructor(
          @Inject('foobar', Override(overrides)) readonly foobar: [HelperService, string],
        ) {}
      }
  
      const injector = Injector.create([
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
      ]).init() as Injector;
  
      const service = injector.get(Service) as Service;
      expect(service).toBeInstanceOf(Service);
      expect(service.foobar).toBeInstanceOf(Array);
      expect(service.foobar[0]).toBeInstanceOf(HelperService);
      expect(service.foobar[1]).toEqual('custom injection');
    });
  
    test('should have possibility to override injection by custom injections', function() {
      const overrides = {
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
  
        method(@Inject() service?: HelperService, @Inject() argument?: HelperService) {
          return [service, argument];
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          @Inject(Override(overrides)) readonly testService: TestService,
        ) {}
      }
  
      const injector = Injector.create([
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
      ]).init() as Injector;
  
      const service = injector.get(Service) as Service;
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

  describe.only('Portal injection hook', function() {
    test('should work with simple graph - dependency in this same injector', function () {
      @Injectable({
        scope: TransientScope,
      })
      class TestService {
        constructor(
          @Inject('foobar') readonly foobar: string,
        ) {}
      }
  
      @Injectable()
      class Service {
        constructor(
          readonly service: TestService,
          @Inject(Portal()) readonly portalService: TestService,
        ) {}
      }
  
      const parentInjector = Injector.create([
        TestService,
        {
          provide: 'foobar',
          useValue: 'parent foobar',
        }
      ]).init() as Injector;
      const childInjector = Injector.create([
        Service,
        {
          provide: 'foobar',
          useValue: 'child foobar',
        }
      ], undefined, parentInjector).init() as Injector;
  
      const service = childInjector.get(Service) as Service;
      expect(service.service).toBeInstanceOf(TestService);
      expect(service.portalService).toBeInstanceOf(TestService);
      expect(service.service === service.portalService).toEqual(false);
      expect(service.service.foobar).toEqual('parent foobar');
      expect(service.portalService.foobar).toEqual('child foobar');
    });

    test('should work with simple graph - dependency in deep injector', function () {
      @Injectable({
        scope: TransientScope,
      })
      class TestService {
        constructor(
          @Inject('foobar') readonly foobar: string,
        ) {}
      }
  
      @Injectable()
      class Service {
        constructor(
          readonly service: TestService,
        ) {}
      }
  
      const parentInjector = Injector.create([
        TestService,
        Service,
        {
          provide: 'foobar',
          useValue: 'parent foobar',
        }
      ]).init() as Injector;
      const childInjector = Injector.create([
        {
          provide: 'foobar',
          useValue: 'child foobar',
        }
      ], undefined, parentInjector).init() as Injector;
  
      const service = childInjector.get(Service, Portal()) as Service;
      expect(service.service).toBeInstanceOf(TestService);
      expect(service.service.foobar).toEqual('child foobar');
    });
  });
});
