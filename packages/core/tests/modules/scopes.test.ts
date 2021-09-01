import { Injector, Injectable, INJECTOR_SCOPE, Module } from "../../src";

describe('Module scopes', function() {
  test('should work with treeshakable providers with module scops (reference to module)', async function() {
    @Module()
    class MainModule {}

    @Injectable({
      provideIn: MainModule,
    })
    class Service {}

    const injector = await new Injector(MainModule).compile();
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
  });

  test('should work with treeshakable providers with custom modules scopes (single scope)', async function() {
    @Injectable({
      provideIn: 'FOOBAR',
    })
    class Service {}

    @Module({ 
      providers: [
        {
          provide: INJECTOR_SCOPE,
          useValue: 'FOOBAR',
        }
      ],
    })
    class MainModule {}

    const injector = await new Injector(MainModule).compile();
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
  });

  test('should work with treeshakable providers with custom modules scopes (multiple scopes)', async function() {
    @Injectable({
      provideIn: 'BARFOO',
    })
    class Service {}

    @Module({ 
      providers: [
        {
          provide: INJECTOR_SCOPE,
          useValue: ['FOOBAR', 'BARFOO'],
        }
      ],
    })
    class MainModule {}

    const injector = await new Injector(MainModule).compile();
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
  });
});
