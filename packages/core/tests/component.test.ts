import { Injector, Injectable, Component } from "../src";

describe.skip('Component', function() {
  test('should works with simple constructor', async function() {
    @Injectable()
    class Service {}

    @Component()
    class Controller {
      constructor(
        readonly service: Service,
      ) {}
    }

    const injector = await new Injector({
      components: [
        Controller,
      ],
      providers: [
        Service,
      ],
    }).build();

    const component = injector.getComponent(Controller) as Controller;
    expect(component).toBeInstanceOf(Controller);
    expect(component.service).toBeInstanceOf(Service);
  });

  test('should not be reached from parent injector', async function() {
    @Injectable()
    class Service {}

    @Component()
    class Controller {
      constructor(
        readonly service: Service,
      ) {}
    }

    const parentInjector = await new Injector({
      components: [
        Controller,
      ],
    }).build();
    const childInjector = await new Injector({
      providers: [
        Service,
      ],
    }, parentInjector).build();

    let err: Error, component: Controller;
    try {
      component = childInjector.getComponent(Controller) as Controller;
    } catch(e) {
      err = e
    }

    expect(component === undefined).toEqual(true);
    expect(err !== undefined).toEqual(true);
  });

  test('should resolve by default as singleton', async function() {
    @Injectable()
    class Service {}

    @Component()
    class Controller {
      constructor(
        readonly service: Service,
      ) {}
    }

    const injector = await new Injector({
      components: [
        Controller,
      ],
      providers: [
        Service,
      ],
    }).build();

    const component1 = injector.getComponent(Controller) as Controller;
    const component2 = injector.getComponent(Controller) as Controller;

    expect(component1).toBeInstanceOf(Controller);
    expect(component2.service).toBeInstanceOf(Service);
    expect(component2).toBeInstanceOf(Controller);
    expect(component2.service).toBeInstanceOf(Service);

    expect(component1 === component2).toEqual(true);
    expect(component1.service === component2.service).toEqual(true);
  });

  test('should not be treated as injectable - cannot be injected in another components/providers)', async function() {
    @Injectable()
    class Service {}

    @Component()
    class Controller1 {
      constructor(
        readonly service: Service,
      ) {}
    }

    @Component()
    class Controller2 {
      constructor(
        readonly service: Service,
        readonly component: Controller1,
      ) {}
    }

    const injector = await new Injector({
      components: [
        Controller1,
        Controller2,
      ],
      providers: [
        Service,
      ],
    }).build();

    let err: Error, component: Controller2;
    try {
      component = injector.getComponent(Controller2) as Controller2;
    } catch(e) {
      err = e
    }

    expect(component === undefined).toEqual(true);
    expect(err !== undefined).toEqual(true);
  });
});
