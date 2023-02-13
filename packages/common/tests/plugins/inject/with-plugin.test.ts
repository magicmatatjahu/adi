import { ADI, Injector, Injectable, Optional } from "@adi/core";
import { inject, injectPlugin } from "../../../src";

describe('Inject plugin', function () {
  const plugin = injectPlugin();

  beforeAll(() => {
    ADI.use(plugin);
  });

  beforeAll(() => {
    ADI.destroy(plugin);
  });

  test('should work in constructor', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      testService: TestService;

      constructor() {
        this.testService = inject(TestService);
      }
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
  });

  test('should work as property injection', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      testService: TestService = inject(TestService);
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
  });

  test('should work in factory', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      testService: TestService = inject(TestService);
    }

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: 'useFactory',
        useFactory() {
          return inject(Service);
        }
      },
    ]).init() as Injector;

    const service = injector.get('useFactory') as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
  });

  test('should work with hooks', function () {
    class TestService {}

    @Injectable()
    class TestServiceExist {}

    @Injectable()
    class Service {
      testServiceNotExist: TestService | string = inject(TestService, Optional()) || 'fallback';
      testServiceExist: TestServiceExist = inject(TestServiceExist);
    }

    const injector = Injector.create([
      Service,
      TestServiceExist,
      {
        provide: 'useFactory',
        useFactory() {
          return inject(Service);
        }
      },
    ]).init() as Injector;

    const service = injector.get('useFactory') as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.testServiceExist).toBeInstanceOf(TestServiceExist);
    expect(service.testServiceNotExist).toEqual('fallback');
  });
});