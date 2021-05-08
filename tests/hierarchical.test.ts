import { Injector, Injectable } from "../src";

describe('Hierarchical injectors', function() {
  test('Should works in simple case (parent <- child relationship)', function() {
    @Injectable()
    class Service {}

    const parentInjector = new Injector([
      Service,
    ]);
    const childInjector = new Injector([], parentInjector);

    const service = childInjector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
  });
});
