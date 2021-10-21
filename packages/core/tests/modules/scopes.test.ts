import { Injector, Injectable, INJECTOR_OPTIONS, Module } from "../../src";

describe('Module scopes', function() {
  test('should work with treeshakable providers with module scops (reference to module)', function() {
    @Module()
    class MainModule {}

    @Injectable({
      provideIn: MainModule,
    })
    class Service {}

    const injector = new Injector(MainModule).build();
    const service = injector.newGet(Service);
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
          provide: INJECTOR_OPTIONS,
          useValue: {
            scope: ['FOOBAR']
          },
        }
      ],
    })
    class MainModule {}

    const injector = new Injector(MainModule).build();
    const service = injector.newGet(Service);
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
          provide: INJECTOR_OPTIONS,
          useValue: {
            scope: ['FOOBAR', 'BARFOO']
          },
        }
      ],
    })
    class MainModule {}

    const injector = new Injector(MainModule).build();
    const service = injector.newGet(Service);
    expect(service).toBeInstanceOf(Service);
  });
});
