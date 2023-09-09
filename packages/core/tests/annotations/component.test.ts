import { Injector, Inject, Injectable, Module } from "../../src";

describe('component annotation', function() {
  test('should able to be injected into another providers with not defined "component" annotation', async function() {
    @Injectable()
    class Component {
      constructor() {}
    }

    @Injectable()
    class Service {
      constructor(
        public component: Component,
      ) {}
    }

    @Module({ 
      providers: [
        Service,
        Component,
      ],
    })
    class RootModule {}

    const injector = Injector.create(RootModule)
    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.component).toBeInstanceOf(Component);
  });

  test('should not able to be injected into another providers with defined "component" annotation', async function() {
    @Injectable({
      annotations: {
        component: true
      }
    })
    class Component {
      constructor() {}
    }

    @Injectable()
    class Service {
      constructor(
        public component: Component,
      ) {}
    }

    @Module({ 
      providers: [
        Service,
        Component,
      ],
    })
    class RootModule {}

    const injector = Injector.create(RootModule)
    expect(() => injector.get(Service)).toThrowError()
  });

  test('should retrieve from injector with defined "component" annotation', async function() {
    @Injectable({
      annotations: {
        component: true
      }
    })
    class Component {}

    @Module({ 
      providers: [
        Component,
      ],
    })
    class RootModule {}

    const injector = Injector.create(RootModule)
    const component = injector.getSync(Component);
    expect(component).toBeInstanceOf(Component);
  });
});
