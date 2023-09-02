import { Injector, Injectable, Optional, InjectionToken, inject, injectMethod } from "../../src";

describe('standalone injection', function () {
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
    ])

    const service = injector.getSync(Service)
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
    ])

    const service = injector.getSync(Service)
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
    ])

    const service = injector.getSync<Service>('useFactory');
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
  });

  test('should work in treeshakable InjectionToken', function () {
    @Injectable()
    class TestService {}

    const token = new InjectionToken<TestService>({
      provideIn: "any",
      provide: {
        useFactory() {
          return inject(TestService);
        },
      }
    });

    @Injectable()
    class Service {
      testService: TestService = inject(token);
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
    ])

    const service = injector.getSync<Service>('useFactory');
    expect(service).toBeInstanceOf(Service);
    expect(service.testService).toBeInstanceOf(TestService);
  });

  test('should work with hooks', function () {
    class TestService {}

    @Injectable()
    class TestServiceExist {}

    @Injectable()
    class Service {
      testServiceNotExist: TestService | 'fallback' = inject(TestService, Optional()) || 'fallback';
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
    ])

    const service = injector.getSync<Service>('useFactory');
    expect(service).toBeInstanceOf(Service);
    expect(service.testServiceExist).toBeInstanceOf(TestServiceExist);
    expect(service.testServiceNotExist).toEqual('fallback');
  });

  test('should work inside method', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor() {
        this.method = injectMethod(this, this.method);
      }

      method() {
        return inject(TestService);
      }
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
    ])

    const service = injector.getSync<Service>('useFactory');
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toBeInstanceOf(TestService);
  });
});
