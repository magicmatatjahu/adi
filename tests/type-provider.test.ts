import { Injector, Injectable, Inject } from "../src";

describe('Type provider (injectable provider)', function() {
  test('should works with class without constructor', function() {
    @Injectable()
    class Service {}

    const injector = new Injector([
      Service,
    ]);

    const service = injector.get(Service);

    expect(service).toBeInstanceOf(Service);
  });

  test('should works with constructor injection', function() {
    @Injectable()
    class HelperService1 {}

    @Injectable()
    class HelperService2 {}

    @Injectable()
    class Service {
      constructor(
        readonly service1: HelperService1,
        readonly service2: HelperService2,
      ) {}
    }

    const injector = new Injector([
      HelperService1,
      HelperService2,
      Service,
    ]);

    // TODO: Don;t return promise from get
    const service = injector.get(Service) as Service;

    expect(service).toBeInstanceOf(Service);
    expect(service.service1).toBeInstanceOf(HelperService1);
    expect(service.service2).toBeInstanceOf(HelperService2);
  });

  test('should works with property injection', function() {
    @Injectable()
    class HelperService1 {}

    @Injectable()
    class HelperService2 {}

    @Injectable()
    class Service {
      @Inject()
      readonly service2: HelperService2;

      constructor(
        // check if constructor injection with property injection isn't broken
        readonly service1: HelperService1,
      ) {}
    }

    const injector = new Injector([
      HelperService1,
      HelperService2,
      Service,
    ]);

    // TODO: Don;t return promise from get
    const service = injector.get(Service) as Service;

    expect(service).toBeInstanceOf(Service);
    expect(service.service1).toBeInstanceOf(HelperService1);
    expect(service.service2).toBeInstanceOf(HelperService2);
  });

  test('should works with setter injection', function() {
    @Injectable()
    class HelperService1 {}

    @Injectable()
    class HelperService2 {}

    @Injectable()
    class Service {
      // check if property injection with setter injection isn't broken
      @Inject()
      readonly service2: HelperService1;

      public _service3: HelperService2;

      @Inject()
      set service3(value: HelperService2) { this._service3 = value; }

      constructor(
        // check if constructor injection with setter injection isn't broken
        readonly service1: HelperService1,
      ) {}
    }

    const injector = new Injector([
      HelperService1,
      HelperService2,
      Service,
    ]);

    // TODO: Don;t return promise from get
    const service = injector.get(Service) as Service;

    expect(service).toBeInstanceOf(Service);
    expect(service.service1).toBeInstanceOf(HelperService1);
    expect(service.service2).toBeInstanceOf(HelperService1);
    expect(service._service3).toBeInstanceOf(HelperService2);
  });

  test('should works with method injection', function() {
    @Injectable()
    class HelperService1 {}

    @Injectable()
    class HelperService2 {}

    @Injectable()
    class Service {
      // check if property injection with method injection isn't broken
      @Inject()
      readonly service2: HelperService1;

      public _service3: HelperService2;

      // check if setter injection with method injection isn't broken
      @Inject()
      set service3(value: HelperService2) { this._service3 = value; }

      constructor(
        // check if constructor injection with method injection isn't broken
        readonly service1: HelperService1,
      ) {}

      method(@Inject() svc?: HelperService1) {
        return svc;
      } 
    }

    const injector = new Injector([
      HelperService1,
      HelperService2,
      Service,
    ]);

    // TODO: Don;t return promise from get
    const service = injector.get(Service) as Service;

    expect(service).toBeInstanceOf(Service);
    expect(service.service1).toBeInstanceOf(HelperService1);
    expect(service.service2).toBeInstanceOf(HelperService1);
    expect(service._service3).toBeInstanceOf(HelperService2);
    expect(service.method()).toBeInstanceOf(HelperService1);
  });
});
