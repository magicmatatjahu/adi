import { Injector, Injectable, Module } from "../../src";

describe('visible annotation', function() {
  test('provider should be injected in parent injector with not defined "visible" annotation', async function() {
    @Injectable()
    class Service {
      constructor() {}
    }

    @Module()
    class ChildModule {}

    @Module({ 
      imports: [
        ChildModule,
      ],
      providers: [
        Service,
      ]
    })
    class RootModule {}

    const injector = Injector.create(RootModule)
    const childInjector = injector.imports.get(ChildModule) as Injector
    const service = childInjector.get(Service);
    expect(service).toBeInstanceOf(Service);
  });

  test('provider should be injected in parent injector with defined "visible=public" annotation', async function() {
    @Injectable({
      annotations: {
        visible: 'public'
      }
    })
    class Service {
      constructor() {}
    }

    @Module()
    class ChildModule {}

    @Module({ 
      imports: [
        ChildModule,
      ],
      providers: [
        Service,
      ]
    })
    class RootModule {}

    const injector = Injector.create(RootModule)
    const childInjector = injector.imports.get(ChildModule) as Injector
    const service = childInjector.get(Service);
    expect(service).toBeInstanceOf(Service);
  });

  test('provider should not be injected in parent injector with defined "visible=private" annotation', async function() {
    @Injectable({
      annotations: {
        visible: 'private'
      }
    })
    class Service {
      constructor() {}
    }

    @Module()
    class ChildModule {}

    @Module({ 
      imports: [
        ChildModule,
      ],
      providers: [
        Service,
      ]
    })
    class RootModule {}

    const injector = Injector.create(RootModule)
    const childInjector = injector.imports.get(ChildModule) as Injector
    expect(injector.get(Service)).toBeInstanceOf(Service);
    expect(() => childInjector.get(Service)).toThrowError();
  });
});
