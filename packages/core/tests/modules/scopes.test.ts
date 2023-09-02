import { Injector, Injectable, Module, INJECTOR_CONFIG } from "../../src";

describe('Module scopes', function() {
  test('should work with treeshakable providers with module scops (reference to module)', function() {
    @Module()
    class MainModule {}

    @Injectable({
      provideIn: MainModule,
    })
    class Service {}

    const injector = new Injector(MainModule)
    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
  });

  test('should work with treeshakable providers with custom modules scopes (single scope)', function() {
    @Injectable({
      provideIn: 'FOOBAR',
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

    const injector = new Injector(MainModule)
    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
  });

  test('should work with treeshakable providers with custom modules scopes (multiple scopes)', function() {
    @Injectable({
      provideIn: 'BARFOO',
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

    const injector = new Injector(MainModule)
    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
  });
});
