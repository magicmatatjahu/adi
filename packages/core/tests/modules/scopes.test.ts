import { Injector, Injectable, Module, INJECTOR_CONFIG } from "../../src";

describe('Module scopes', function() {
  test('should work with treeshakable providers with module scops (reference to module)', function() {
    @Module()
    class MainModule {}

    @Injectable({
      annotations: {
        'adi:provide-in': MainModule,
      }
    })
    class Service {}

    const injector = new Injector(MainModule).init() as Injector;
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
  });

  test('should work with treeshakable providers with custom modules scopes (single scope)', function() {
    @Injectable({
      annotations: {
        'adi:provide-in': 'FOOBAR',
      }
    })
    class Service {}

    @Module({ 
      providers: [
        {
          provide: INJECTOR_CONFIG,
          useValue: {
            scopes: ['FOOBAR']
          },
        }
      ],
    })
    class MainModule {}

    const injector = new Injector(MainModule).init() as Injector;
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
  });

  test('should work with treeshakable providers with custom modules scopes (multiple scopes)', function() {
    @Injectable({
      annotations: {
        'adi:provide-in': 'BARFOO',
      }
    })
    class Service {}

    @Module({ 
      providers: [
        {
          provide: INJECTOR_CONFIG,
          useValue: {
            scopes: ['FOOBAR', 'BARFOO']
          },
        }
      ],
    })
    class MainModule {}

    const injector = new Injector(MainModule).init() as Injector;
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
  });
});