import { Injector, Injectable, Component, Module } from "../../src";

describe('Module', function() {
  test('should be able to create injector from module', async function() {
    @Injectable()
    class Service {}

    @Module({
      providers: [
        Service,
      ]
    })
    class MainModule {}

    const injector = await new Injector(MainModule).compile();

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
  });

  test('should inject given providers in constructor', async function() {
    @Injectable()
    class Service {}

    let createdService: Service = undefined;

    @Module({
      providers: [
        Service,
      ]
    })
    class MainModule {
      constructor(
        readonly service: Service,
      ) {
        createdService = service;
      }
    }

    const _ = await new Injector(MainModule).compile();
    expect(createdService).toBeInstanceOf(Service);
  });

  test('should be able to create components', async function() {
    @Injectable()
    class Service {}

    @Component()
    class Controller {
      constructor(
        readonly service: Service,
      ) {}
    }

    @Module({
      components: [
        Controller,
      ],
      providers: [
        Service,
      ],
    })
    class MainModule {
      constructor(
        readonly service: Service,
      ) {}
    }

    const injector = await new Injector(MainModule).compile();
    const component = injector.getComponent(Controller) as Controller;
    expect(component).toBeInstanceOf(Controller);
    expect(component.service).toBeInstanceOf(Service);
  });
});
