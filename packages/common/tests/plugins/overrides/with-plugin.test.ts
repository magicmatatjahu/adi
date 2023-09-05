import { ADI, Injector, Injectable, Inject, Token } from "@adi/core";

import { Override } from "../../../src/hooks/override";
import { overridesPlugin } from "../../../src/plugins/overrides.plugin";

import type { Injections } from '@adi/core';

describe('Overrides plugin with Override injection hook', function () {
  const plugin = overridesPlugin();

  beforeAll(() => {
    ADI.use(plugin);
  });

  beforeAll(() => {
    ADI.destroy(plugin);
  });

  describe('Override injection hook', function() {
    test.only('should work', function () {
      const overrides: Injections = {
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
      ])
  
      const service = injector.getSync(Service)
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
      ])
  
      const service = injector.getSync(Service);
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
      ])
  
      const service = injector.getSync(Service)
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
      ])
  
      const service = injector.getSync(Service)
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
});
