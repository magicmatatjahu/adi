import { Injector, Inject, Injectable, Destroyable, DestroyableType, TransientScope } from "../../src";

describe('Destroyable injection hook', function () {
  test('should works - simple case', async function () {
    let destroyTimes: number = 0;

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      onDestroy() {
        destroyTimes++;
      }
    }

    const injector = Injector.create([
      Service,
    ]).init() as Injector;

    let service = injector.get(Service, [Destroyable()]) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);
    await service.destroy();

    service = injector.get(Service, [Destroyable()]) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);

    await service.destroy();
    expect(destroyTimes).toEqual(2);
  });

  test('should not call onDestroy hook when instance has at least one parent link', async function () {
    let destroyTimes: number = 0;

    @Injectable({
      scope: TransientScope,
    })
    class TransientService {
      onDestroy() {
        destroyTimes++;
      }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(TransientService, [Destroyable()]) public testService1: DestroyableType<TransientService>,
        @Inject(TransientService, [Destroyable()]) public testService2: DestroyableType<TransientService>,
      ) {}
    }

    const injector = Injector.create([
      TransientService,
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.testService1.value).toBeInstanceOf(TransientService);
    expect(service.testService2.value).toBeInstanceOf(TransientService);

    service.testService1.destroy();
    service.testService2.destroy();
    expect(destroyTimes).toEqual(0);
  });
});
