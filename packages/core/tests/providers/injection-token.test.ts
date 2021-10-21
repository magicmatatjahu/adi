import { Injector, Injectable, InjectionToken, Module, ANNOTATIONS, INJECTOR_OPTIONS } from "../../src";

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
  
      const resolvedToken = injector.newGet(Token);
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
  
      const resolvedToken = injector.newGet(Token);
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
  
      const resolvedToken = injector.newGet(Token);
      expect(resolvedToken).toBeInstanceOf(Service);
    });

    test.skip('with useExisting', function() {
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
        provideIn: 'any',
        useValue: 'foobar',
      });

      const injector = new Injector();
  
      const resolvedToken = injector.newGet(Token);
      expect(resolvedToken).toEqual('foobar');
    });

    test('with useFactory', function() {
      const Token = new InjectionToken<string>({
        provideIn: 'any',
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
  
      const resolvedToken = injector.newGet(Token);
      expect(resolvedToken).toEqual('foobar');
    });

    test('with useClass', function() {
      @Injectable()
      class Service {}

      const Token = new InjectionToken<Service>({
        provideIn: 'any',
        useClass: Service,
      });

      const injector = new Injector();
  
      const resolvedToken = injector.newGet(Token);
      expect(resolvedToken).toBeInstanceOf(Service);
    });

    test.skip('with useExisting', function() {
      const Token = new InjectionToken<string>({
        provideIn: 'any',
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

    test('should override tree shakable provider when this same token is defined in providers array', async () => {
      const token = new InjectionToken<string>({
        provideIn: "any",
        useValue: "foobar",
      });
  
      const injector = new Injector([
        {
          provide: token,
          useValue: "barfoo",
        }
      ]);
  
      const value = injector.newGet(token);
      expect(value).toEqual("barfoo");
    });

    test('should use another tree shakable InjectionToken', async () => {
      const helperToken = new InjectionToken<string>({
        provideIn: "any",
        useValue: "foobar",
      });

      const token = new InjectionToken<string>({
        provideIn: "any",
        useFactory(value) {
          return value;
        },
        inject: [helperToken],
      });
  
      const injector = new Injector();
  
      const value = injector.newGet(token);
      expect(value).toEqual("foobar");
    });

    test('should works with EXPORT annotation', async () => {
      @Module({
        providers: [
          {
            provide: INJECTOR_OPTIONS,
            useValue: {
              scope: 'child',
            },
          }
        ]
      })
      class ChildModule {}

      @Module({
        imports: [
          ChildModule,
        ]
      })
      class ParentModule {}

      const token = new InjectionToken<string>({
        provideIn: "child",
        useValue: "foobar",
        annotations: {
          [ANNOTATIONS.EXPORT]: true,
        }
      });

      const injector = Injector.create(ParentModule).build();
      const value = injector.newGet(token);
      expect(value).toEqual("foobar");
    });
  })
});
