import { Injector, Injectable } from "../src";

describe.only('Component', function() {
  test('should works with simple constructor', function() {
    @Injectable()
    class Service {}

    @Injectable()
    class Component {
      constructor(
        readonly service: Service,
      ) {}
    }

    const injector = Injector.create({
      components: [
        Component,
      ],
      providers: [
        Service,
      ],
    }).build();

    const component = injector.get(Component);
    expect(component).toBeInstanceOf(Component);
    expect(component.service).toBeInstanceOf(Service);
  });

  test('should not be reached from parent injector', function() {
    @Injectable()
    class Component {}

    const parentInjector = Injector.create({
      components: [
        Component,
      ],
    }).build();
    const childInjector = Injector.create({}, parentInjector);

    let err: Error, fromParent: Component, fromChild: Component;
    try {
      fromParent = parentInjector.get(Component);
      fromChild = childInjector.get(Component);
    } catch(e) {
      err = e
    }

    expect(fromParent).toBeInstanceOf(Component)
    expect(fromChild === undefined).toEqual(true);
    expect(err !== undefined).toEqual(true);
  });

  test('should resolve by default as singleton', function() {
    @Injectable()
    class Service {}

    @Injectable()
    class Component {
      constructor(
        readonly service: Service,
      ) {}
    }

    const injector = Injector.create({
      components: [
        Component,
      ],
      providers: [
        Service,
      ],
    }).build();

    const component1 = injector.get(Component);
    const component2 = injector.get(Component);

    expect(component1).toBeInstanceOf(Component);
    expect(component2.service).toBeInstanceOf(Service);
    expect(component2).toBeInstanceOf(Component);
    expect(component2.service).toBeInstanceOf(Service);

    expect(component1 === component2).toEqual(true);
    expect(component1.service === component2.service).toEqual(true);
  });

  test('should not be treated as injectable - cannot be injected in another components/providers)', function() {
    @Injectable()
    class Service {}

    @Injectable()
    class Component1 {
      constructor(
        readonly service: Service,
      ) {}
    }

    @Injectable()
    class Component2 {
      constructor(
        readonly service: Service,
        readonly component: Component1,
      ) {}
    }

    const injector = Injector.create({
      components: [
        Component1,
        Component2,
      ],
      providers: [
        Service,
      ],
    }).build();

    let err: Error, component1: Component1, component2: Component2;
    try {
      component1 = injector.get(Component1);
      component2 = injector.get(Component2);
    } catch(e) {
      err = e
    }

    expect(component1).toBeInstanceOf(Component1)
    expect(component2 === undefined).toEqual(true);
    expect(err !== undefined).toEqual(true);
  });
});
