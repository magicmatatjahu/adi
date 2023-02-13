import { ADI, Injector, Injectable } from "@adi/core";
import { extendedProviderPlugin } from "../../../src";

describe('Extended provider plugin', function () {
  const plugin = extendedProviderPlugin();

  beforeAll(() => {
    ADI.use(plugin);
  });

  beforeAll(() => {
    ADI.destroy(plugin);
  });

  test('should work with injectable class', function () {
    @Injectable()
    class TestService {}

    @Injectable({
      providers: [
        TestService,
      ]
    })
    class Service {
      constructor(
        public testService: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(() => injector.get(TestService)).toThrow();
  });

  test('should work with class provider', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        public testService: TestService,
      ) {}
    }

    const injector = Injector.create([
      {
        provide: Service,
        useClass: Service,
        providers: [
          TestService,
        ]
      },
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(() => injector.get(TestService)).toThrow();
  });

  test('should work with factory provider', function () {
    @Injectable()
    class TestService {}

    class Service {
      constructor(
        public testService: TestService,
      ) {}
    }

    const injector = Injector.create([
      {
        provide: Service,
        useFactory(testService: TestService) {
          return new Service(testService);
        },
        inject: [TestService],
        providers: [
          TestService,
        ]
      },
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
    expect(() => injector.get(TestService)).toThrow();
  });
});