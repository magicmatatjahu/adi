import { Injector, Injectable, Inject } from "../src";

describe('Provider', function() {
  describe('useValue', function() {
    test('should works with simple provider', function() {
      const injector = new Injector([
        {
          provide: 'useValue',
          useValue: 'foobar',
        },
      ]);
  
      const resolvedToken = injector.get<string>('useValue');
      expect(resolvedToken).toEqual('foobar');
    });
  });

  describe('useFactory', function() {
    test('should works with only function', function() {
      const injector = new Injector([
        {
          provide: 'useFactory',
          useFactory() { return "foobar" },
        },
      ]);
  
      const resolvedToken = injector.get<string>('useFactory');
      expect(resolvedToken).toEqual('foobar');
    });

    test('should works with injection array (single param)', function() {
      const injector = new Injector([
        {
          provide: 'useValue',
          useValue: 'foobar',
        },
        {
          provide: 'useFactory',
          useFactory(foobar) { return foobar },
          inject: ['useValue']
        },
      ]);
  
      const resolvedToken = injector.get<string>('useFactory');
      expect(resolvedToken).toEqual('foobar');
    });

    test('should works with injection array (multiple params)', function() {
      const injector = new Injector([
        {
          provide: 'useValue1',
          useValue: 'foobar',
        },
        {
          provide: 'useValue2',
          useValue: 'barfoo',
        },
        {
          provide: 'useFactory',
          useFactory(foobar, barfoo) { return [foobar, barfoo] },
          inject: ['useValue1', 'useValue2']
        },
      ]);
  
      const resolvedToken = injector.get<string[]>('useFactory');
      expect(resolvedToken).toEqual(['foobar', 'barfoo']);
    });
  });

  describe('useClass', function() {
    test('should works with simple class without constructor', function() {
      @Injectable()
      class Service {}

      const injector = new Injector([
        {
          provide: 'useValue',
          useClass: Service,
        },
      ]);
  
      const resolvedToken = injector.get<Service>('useValue');
      expect(resolvedToken).toBeInstanceOf(Service);
    });

    test('should works with simple class with constructor', function() {
      @Injectable()
      class HelperService {}

      @Injectable()
      class Service {
        constructor(
          readonly service: HelperService,
        ) {}
      }

      const injector = new Injector([
        HelperService,
        {
          provide: 'useValue',
          useClass: Service,
        },
      ]);
  
      const resolvedToken = injector.get<Service>('useValue');
      expect(resolvedToken).toBeInstanceOf(Service);
    });
  });

  describe('useExisting', function() {
    test('should return value from alias', function() {
      @Injectable()
      class Service {}

      const injector = new Injector([
        Service,
        {
          provide: 'useValue',
          useExisting: Service,
        },
      ]);
  
      const service = injector.get(Service);
      const resolvedToken = injector.get<Service>('useValue');
      expect(resolvedToken).toBeInstanceOf(Service);
      expect(service).toEqual(resolvedToken);
    });

    test('should use internal provider record from alias', function() {
      @Injectable()
      class Service {}

      const injector = new Injector([
        Service,
        {
          provide: 'useValue',
          useExisting: Service,
        },
      ]);
  
      const service = injector.get(Service);
      const resolvedToken = injector.get<Service>('useValue');
      expect(resolvedToken).toBeInstanceOf(Service);
      expect(service).toEqual(resolvedToken);

      // checks provider records. `useValue` provider record should point to provider record from `Service`
      const records = (injector as any).records;
      const useValueRecord = records.get('useValue');
      const serviceRecord = records.get(Service);
      expect(useValueRecord).toEqual(serviceRecord);
    });
  });
});
