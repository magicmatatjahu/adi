import { Injector, Inject, Injectable, Scope, Destroyable, DestroyableType } from "../../src";

describe('Destroyable wrapper', function () {
  test('should works - simple case', async function () {
    let destroyTimes: number = 0;

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class Service {
      onDestroy() {
        destroyTimes++;
      }
    }

    const injector = new Injector([
      Service,
    ]);

    let service: DestroyableType<Service> = injector.get(Service, Destroyable()) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);
    await service.destroy();

    service = injector.get(Service, Destroyable()) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);
    await service.destroy();

    // wait 100ms to resolve all promises in DestroyManager
    await new Promise(resolve => {
      setTimeout(() => {
        resolve(undefined);
      }, 100);
    });
    expect(destroyTimes).toEqual(2);
  });

  test('should not call onDestroy hook when instance has at least one parent link', async function () {
    let destroyTimes: number = 0;

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TransientService {
      onDestroy() {
        destroyTimes++;
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(TransientService, Destroyable()) public testService1: DestroyableType<TransientService>,
        @Inject(TransientService, Destroyable()) public testService2: DestroyableType<TransientService>,
      ) {}
    }

    const injector = new Injector([
      TransientService,
      Service,
    ]);

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.testService1.value).toBeInstanceOf(TransientService);
    expect(service.testService2.value).toBeInstanceOf(TransientService);

    service.testService1.destroy();
    service.testService2.destroy();

    // wait 100ms to resolve all promises in DestroyManager
    await new Promise(resolve => {
      setTimeout(() => {
        resolve(undefined);
      }, 100);
    });
    expect(destroyTimes).toEqual(0);
  });
});
