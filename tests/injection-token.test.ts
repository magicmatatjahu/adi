import { Injector, Injectable, InjectionToken } from "../src";

describe('InjectionToken', function() {
  describe('should works as normal provider in providers array', function() {
    test('with useValue', function() {
      const Token = new InjectionToken<string>();

      const injector = new Injector([
        {
          provide: Token,
          useValue: 'foobar',
        },
      ]);
  
      const resolvedToken = injector.get(Token);
      expect(resolvedToken).toEqual('foobar');
    });

    test('with useFactory', function() {
      const Token = new InjectionToken<string>();

      const injector = new Injector([
        {
          provide: 'useValue',
          useValue: 'foobar',
        },
        {
          provide: Token,
          useFactory(useValue) {
            return useValue;
          },
          inject: ['useValue'],
        },
      ]);
  
      const resolvedToken = injector.get(Token);
      expect(resolvedToken).toEqual('foobar');
    });

    test('with useClass', function() {
      @Injectable()
      class Service {}

      const Token = new InjectionToken<Service>();

      const injector = new Injector([
        {
          provide: Token,
          useClass: Service,
        },
      ]);
  
      const resolvedToken = injector.get(Token);
      expect(resolvedToken).toBeInstanceOf(Service);
    });

    test('with useExisting', function() {
      @Injectable()
      class Service {}

      const Token = new InjectionToken<string>();

      const injector = new Injector([
        {
          provide: 'useValue',
          useValue: 'foobar',
        },
        {
          provide: Token,
          useExisting: 'useValue',
        },
      ]);
  
      const resolvedToken = injector.get(Token);
      expect(resolvedToken).toEqual('foobar');
    });
  });

  describe('should works as tree shakable provider', function() {
    test('with useValue', function() {
      const Token = new InjectionToken<string>({
        providedIn: 'any',
        useValue: 'foobar',
      });

      const injector = new Injector();
  
      const resolvedToken = injector.get(Token);
      expect(resolvedToken).toEqual('foobar');
    });

    test('with useFactory', function() {
      const Token = new InjectionToken<string>({
        providedIn: 'any',
        useFactory(useValue) {
          return useValue;
        },
        inject: ['useValue'],
      });

      const injector = new Injector([
        {
          provide: 'useValue',
          useValue: 'foobar',
        },
      ]);
  
      const resolvedToken = injector.get(Token);
      expect(resolvedToken).toEqual('foobar');
    });

    test('with useClass', function() {
      @Injectable()
      class Service {}

      const Token = new InjectionToken<Service>({
        providedIn: 'any',
        useClass: Service,
      });

      const injector = new Injector();
  
      const resolvedToken = injector.get(Token);
      expect(resolvedToken).toBeInstanceOf(Service);
    });

    test('with useExisting', function() {
      @Injectable()
      class Service {}

      const Token = new InjectionToken<string>({
        providedIn: 'any',
        useExisting: 'useValue',
      });

      const injector = new Injector([
        {
          provide: 'useValue',
          useValue: 'foobar',
        },
      ]);
  
      const resolvedToken = injector.get(Token);
      expect(resolvedToken).toEqual('foobar');
    });
  })
});
