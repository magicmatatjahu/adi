import { ADI, Injector, Injectable, destroy, TransientScope } from "@adi/core";
import { resolvedInstances } from "@adi/core/lib/injector/provider";

import { injectorProviderPlugin, providerInjectorMetaKey } from "../../../src/plugins/injector-provider.plugin";

describe('Injector provider plugin', function () {
  const plugin = injectorProviderPlugin();

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

  test('should destroy injector when provider instance is destroyed', async function () {
    const calls: string[] = [];

    @Injectable()
    class TestService {
      onDestroy() {
        calls.push('TestService')
      }
    }

    @Injectable({
      scope: TransientScope,
      providers: [
        TestService,
      ]
    })
    class Service {
      constructor(
        public testService: TestService,
      ) {}

      onDestroy() {
        calls.push('Service')
      }
    }

    const injector = Injector.create([
      Service,
    ]).init() as Injector;
    
    const service = injector.get(Service) as Service;
    const instance = resolvedInstances.get(service)
    const subInjector = instance?.meta[providerInjectorMetaKey] as Injector;
    
    await destroy(instance)
    expect(calls).toEqual(['Service', 'TestService']);
    expect((subInjector.status & 8) > 0).toEqual(true)
  });
});