import { Injector, Injectable, InjectionToken, Module, INJECTOR_OPTIONS, Optional } from "../../src";

describe('InjectionToken', function() {
  describe('should work as normal provider in providers array', function() {
    test('with useValue', function() {
      const Token = InjectionToken.create<string>();

      const injector = Injector.create([
        {
          provide: Token,
          useValue: 'foobar',
        },
      ]);
  
      const resolvedToken = injector.get(Token);
      expect(resolvedToken).toEqual('foobar');
    });

    test('with useFactory', function() {
      const Token = InjectionToken.create<string>();

      const injector = Injector.create([
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

      const Token = InjectionToken.create<Service>();

      const injector = Injector.create([
        {
          provide: Token,
          useClass: Service,
        },
      ]);
  
      const resolvedToken = injector.get(Token);
      expect(resolvedToken).toBeInstanceOf(Service);
    });

    test('with useExisting', function() {
      const Token = InjectionToken.create<string>();

      const injector = Injector.create([
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

    test('as standalone provider', function() {
      const Token = InjectionToken.provide<string>({
        useValue: 'foobar',
      });

      const injector = Injector.create([
        Token,
      ]);
  
      const resolvedToken = injector.get(Token);
      expect(resolvedToken).toEqual('foobar');
    });
  });

  describe('should work as injection argument', function() {
    test('with provider token argument', function() {
      @Injectable()
      class Service {}

      const Token = InjectionToken.argument(Service);

      const injector = Injector.create([
        Service,
      ]);
  
      const resolvedToken = injector.get(Token);
      expect(resolvedToken).toBeInstanceOf(Service);
    });

    test('with injection hooks', function() {
      @Injectable()
      class Service {}

      const Token = InjectionToken.argument(Service, Optional());

      const injector = Injector.create();
  
      const resolvedToken = injector.get(Token);
      expect(resolvedToken).toEqual(undefined);
    });
  })

  describe('should work as tree shakable provider', function() {
    test('with useValue', function() {
      const Token = InjectionToken.provide({
        provideIn: 'any',
        useValue: 'foobar',
      });

      const injector = Injector.create();
  
      const resolvedToken = injector.get(Token);
      expect(resolvedToken).toEqual('foobar');
    });

    test('with useFactory', function() {
      const Token = InjectionToken.provide<string>({
        provideIn: 'any',
        useFactory(useValue) {
          return useValue;
        },
        inject: ['useValue'],
      });

      const injector = Injector.create([
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

      const Token = InjectionToken.provide({
        provideIn: 'any',
        useClass: Service,
      });

      const injector = Injector.create();
  
      const resolvedToken = injector.get(Token);
      expect(resolvedToken).toBeInstanceOf(Service);
    });

    test('with useExisting', function() {
      const Token = InjectionToken.provide<string>({
        provideIn: 'any',
        useExisting: 'useValue',
      });

      const injector = Injector.create([
        {
          provide: 'useValue',
          useValue: 'foobar',
        },
      ]);
  
      const resolvedToken = injector.get(Token);
      expect(resolvedToken).toEqual('foobar');
    });

    test('should override tree shakable provider when this same token is defined in providers array', async () => {
      const token = InjectionToken.provide({
        provideIn: "any",
        useValue: "foobar",
      });
  
      const injector = Injector.create([
        {
          provide: token,
          useValue: "barfoo",
        }
      ]);
  
      const value = injector.get(token);
      expect(value).toEqual("barfoo");
    });

    test('should use another tree shakable InjectionToken', async () => {
      const helperToken = InjectionToken.provide<string>({
        provideIn: "any",
        useValue: "foobar",
      });

      const token = InjectionToken.provide<string>({
        provideIn: "any",
        useFactory(value: string) {
          return value;
        },
        inject: [helperToken],
      });
  
      const injector = Injector.create();
  
      const value = injector.get(token);
      expect(value).toEqual("foobar");
    });

    test('should works with custom injector scope', async () => {
      @Module({
        providers: [
          {
            provide: INJECTOR_OPTIONS,
            useValue: {
              scopes: ['child'],
            },
          }
        ]
      })
      class MainModule {}

      const token = InjectionToken.provide<string>({
        provideIn: "child",
        useValue: "foobar",
      });

      const injector = Injector.create(MainModule);
      const value = injector.get(token);
      expect(value).toEqual("foobar");
    });
  })
});
