import { Injector, Injectable, Module } from "../../src";

describe('Module', function() {
  test('should be able to create injector from module and instances of the corresponding providers', async function() {
    @Injectable()
    class Service {}

    @Module({
      providers: [
        Service,
      ]
    })
    class MainModule {}

    const injector = new Injector(MainModule).build();

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
  });

  test('should inject providers to the module instance', function() {
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

    new Injector(MainModule).build();
    expect(createdService).toBeInstanceOf(Service);
  });

  // test('should be able to create components', function() {
  //   @Injectable()
  //   class Service {}

  //   @Component()
  //   class Controller {
  //     constructor(
  //       readonly service: Service,
  //     ) {}
  //   }

  //   @Module({
  //     components: [
  //       Controller,
  //     ],
  //     providers: [
  //       Service,
  //     ],
  //   })
  //   class MainModule {
  //     constructor(
  //       readonly service: Service,
  //     ) {}
  //   }

  //   const injector = new Injector(MainModule).compile();
  //   const component = injector.getComponent(Controller) as Controller;
  //   expect(component).toBeInstanceOf(Controller);
  //   expect(component.service).toBeInstanceOf(Service);
  // });
});
