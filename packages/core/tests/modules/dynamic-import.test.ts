import { Injector, Injectable, Module, OnDestroy, OnInit, when, Inject, Named } from "../../src";

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

  // TODO: handle such a case
  test.skip('should be able to import module in the runtime (exports module in imported module)', async function() {
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
});
