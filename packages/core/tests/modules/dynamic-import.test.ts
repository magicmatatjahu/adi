import { Injector, Injectable, Module, ref } from "../../src";

describe('Module dynamic import', function() {
  test('should be able to import module in the runtime', async function() {
    @Injectable()
    class Service {}

    @Module({
      providers: [
        Service,
      ],
      exports: [
        Service,
      ]
    })
    class ChildModule {}

    @Module()
    class MainModule {}

    const injector = await Injector.create(MainModule).init();
    expect(() => injector.get(Service)).toThrow();
    
    await injector.import(ChildModule);
    expect(injector.get(Service)).toBeInstanceOf(Service);
  });

  test('should be able to import module in the runtime (imports module in imported module)', async function() {
    @Injectable()
    class Service {}

    @Module({
      providers: [
        Service,
      ],
      exports: [
        Service,
      ]
    })
    class Child1Module {}

    @Module({
      imports: [
        Child1Module,
      ],
    })
    class Child2Module {}

    @Module()
    class MainModule {}

    const injector = await Injector.create(MainModule).init();
    expect(() => injector.get(Service)).toThrow();
    
    const imported = await injector.import(Child2Module);
    expect(imported.get(Service)).toBeInstanceOf(Service);
  });

  test('should be able to import module in the runtime (exports module in imported module)', async function() {
    @Injectable()
    class Service {}

    @Module({
      providers: [
        Service,
      ],
      exports: [
        Service,
      ]
    })
    class Child1Module {}

    @Module({
      exports: [
        Child1Module,
      ]
    })
    class Child2Module {}

    @Module()
    class MainModule {}

    const injector = await Injector.create(MainModule).init();
    expect(() => injector.get(Service)).toThrow();
    
    await injector.import(Child2Module);
    expect(injector.get(Service)).toBeInstanceOf(Service);
  });

  test('should be able to import module with dynamic import - class case', async function() {
    @Module({
      imports: [
        ref(() => {
          const dynamicModule = import('./dynamic-import.testdata').then(dynamic => dynamic.DynamicModule);
          return dynamicModule;
        })
      ]
    })
    class MainModule {}

    const injector = await Injector.create(MainModule).init();
    const service = injector.get('service');
    expect(service.constructor.name).toEqual('DynamicService');
  });

  test('should be able to import module with dynamic import - module token case', async function() {
    @Module({
      imports: [
        ref(() => {
          const dynamicModule = import('./dynamic-import.testdata').then(dynamic => dynamic.DynamicModuleToken);
          return dynamicModule;
        })
      ]
    })
    class MainModule {}

    const injector = await Injector.create(MainModule).init();
    const service = injector.get('service');
    expect(service.constructor.name).toEqual('DynamicService');
  });
});
