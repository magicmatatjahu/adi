import { Injector, Injectable, Module, ProvideIn, INJECTOR_CONFIG, ADI } from "../../src";

describe('Module scopes', function() {
  test('should work with treeshakable providers with module scope (reference to module)', function() {
    @Module()
    class MainModule {}

    @Injectable({
      provideIn: MainModule,
    })
    class Service {}

    const injector = Injector.create(MainModule)
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

    const injector = Injector.create(MainModule)
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

    const injector = Injector.create(MainModule)
    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
  });

  test('should work with treeshakable providers with "any" scope', function() {
    @Module()
    class ChildModule {}

    @Module({
      imports: [ChildModule]
    })
    class MainModule {}

    @Injectable({
      provideIn: ProvideIn.ANY,
    })
    class Service {}

    const injector = Injector.create(MainModule)
    const childInjector = injector.imports.get(ChildModule) as Injector

    const service = injector.getSync(Service);
    const childService = childInjector.getSync(Service);

    expect(service).toBeInstanceOf(Service);
    expect(childService).toBeInstanceOf(Service);
    expect(service === childService).toEqual(false);
  });

  test('should work with treeshakable providers with "root" scope', function() {
    @Module()
    class ChildModule {}

    @Module({
      imports: [ChildModule]
    })
    class MainModule {}

    @Injectable({
      provideIn: ProvideIn.ROOT,
    })
    class Service {}

    const injector = Injector.create(MainModule)
    const childInjector = injector.imports.get(ChildModule) as Injector

    const service = injector.getSync(Service);
    const childService = childInjector.getSync(Service);

    expect(service).toBeInstanceOf(Service);
    expect(childService).toBeInstanceOf(Service);
    expect(service === childService).toEqual(true);
  });

  test('should work with treeshakable providers with "root" scope (multiple roots)', function() {
    @Module()
    class ChildModule {}

    @Module({
      imports: [ChildModule]
    })
    class MainModule {}

    @Injectable({
      provideIn: ProvideIn.ROOT,
    })
    class Service {}

    const injector1 = Injector.create(MainModule)
    const childInjector1 = injector1.imports.get(ChildModule) as Injector

    const injector2 = Injector.create(MainModule)
    const childInjector2 = injector2.imports.get(ChildModule) as Injector

    const service1 = injector1.getSync(Service);
    const childService1 = childInjector1.getSync(Service);

    const service2 = injector2.getSync(Service);
    const childService2 = childInjector2.getSync(Service);

    expect(service1).toBeInstanceOf(Service);
    expect(childService1).toBeInstanceOf(Service);
    expect(service1 === childService1).toEqual(true);
    expect(service2).toBeInstanceOf(Service);
    expect(childService2).toBeInstanceOf(Service);
    expect(service2 === childService2).toEqual(true);
    expect(service1 === service2).toEqual(false);
    expect(childService1 === childService2).toEqual(false);
    expect(service1 === childService2).toEqual(false);
    expect(service2 === childService1).toEqual(false);
  });

  test('should work with treeshakable providers with "core" scope', function() {
    @Module()
    class ChildModule {}

    @Module({
      imports: [ChildModule]
    })
    class MainModule {}

    @Injectable({
      provideIn: ProvideIn.CORE,
    })
    class Service {}

    const injector = Injector.create(MainModule)
    const childInjector = injector.imports.get(ChildModule) as Injector

    const service = injector.getSync(Service);
    const childService = childInjector.getSync(Service);
    const coreService = ADI.core.getSync(Service);

    expect(service).toBeInstanceOf(Service);
    expect(childService).toBeInstanceOf(Service);
    expect(coreService).toBeInstanceOf(Service);
    expect(service === childService).toEqual(true);
    expect(service === coreService).toEqual(true);
    expect(childService === coreService).toEqual(true);
  });
});
