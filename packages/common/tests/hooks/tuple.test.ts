import { Injector, Injectable, Inject, Token, Optional } from "@adi/core";
import { Tuple } from "../../src";

describe('Tuple injection hook', function () {
  test('should work with tokens', function () {
    @Injectable()
    class TestService1 {}

    @Injectable()
    class TestService2 {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Tuple([TestService1, TestService2])) readonly services: [TestService1, TestService2],
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService1,
      TestService2,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.services).toBeInstanceOf(Array);
    expect(service.services[0]).toBeInstanceOf(TestService1);
    expect(service.services[1]).toBeInstanceOf(TestService2);
  });

  test('should work with hook', function () {
    @Injectable()
    class TestService1 {}

    @Injectable()
    class TestService2 {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Tuple([TestService1, [Token(TestService2), Optional()]])) readonly services: [TestService1, TestService2],
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService1,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.services).toBeInstanceOf(Array);
    expect(service.services[0]).toBeInstanceOf(TestService1);
    expect(service.services[1]).toEqual(undefined);
  });
});
