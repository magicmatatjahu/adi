import { Injector, Injectable, TransientScope, Destroyable, DestroyableType } from "@adi/core";
import { PooledScope } from "../../src"

import type { OnPool } from '../../src';

describe('Pooled scope', function () {
  test('should create new instances for every new inject', function () {
    @Injectable({
      scope: PooledScope({ capacity: 3 }),
    })
    class PoolService {}

    @Injectable({
      scope: TransientScope,
    })
    class TempService {
      constructor(
        readonly poolService: PoolService,
      ) {}
    }

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      constructor(
        readonly service1: TempService,
        readonly service2: TempService,
        readonly service3: TempService,
      ) {}
    }

    const injector = Injector.create([
      PoolService,
      TempService,
      Service,
    ]).init() as Injector;

    let service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.service1).toBeInstanceOf(TempService);
    expect(service.service2).toBeInstanceOf(TempService);
    expect(service.service3).toBeInstanceOf(TempService);
    expect(service.service1.poolService).toBeInstanceOf(PoolService);
    expect(service.service2.poolService).toBeInstanceOf(PoolService);
    expect(service.service3.poolService).toBeInstanceOf(PoolService);
    expect(service.service1.poolService === service.service2).toEqual(false);
    expect(service.service2.poolService === service.service3).toEqual(false);
  });

  test('should reuse instance when some instance in in pool', async function () {
    let onInitCalls = 0;

    @Injectable({
      scope: PooledScope({ capacity: 2 }),
    })
    class PoolService {
      constructor() {
        onInitCalls++;
      }
    }

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      constructor(
        readonly poolService1: PoolService,
        readonly poolService2: PoolService,
      ) {}
    }

    const injector = Injector.create([
      PoolService,
      Service,
    ]).init() as Injector;

    let service = injector.get(Service, Destroyable()) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);
    expect(service.value.poolService1).toBeInstanceOf(PoolService);
    expect(service.value.poolService2).toBeInstanceOf(PoolService);
    await service.destroy();

    service = injector.get(Service, Destroyable()) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);
    expect(service.value.poolService1).toBeInstanceOf(PoolService);
    expect(service.value.poolService2).toBeInstanceOf(PoolService);
    await service.destroy();

    // only 2 because pool has capacity 2 and pool reuse given instances
    expect(onInitCalls).toEqual(2);
  });

  test('should reuse instance when some instance in in pool, and some create as new - pool capacity is full', async function () {
    let onInitCalls = 0;
    let onDestroyCalls = 0;

    @Injectable({
      scope: PooledScope({ capacity: 2 }),
    })
    class PoolService {
      constructor() {
        onInitCalls++;
      }

      onDestroy() {
        onDestroyCalls++;
      }
    }

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      constructor(
        readonly poolService1: PoolService,
        readonly poolService2: PoolService,
        readonly poolService3: PoolService,
      ) {}
    }

    const injector = Injector.create([
      PoolService,
      Service,
    ]).init() as Injector;

    let service = injector.get(Service, Destroyable()) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);
    expect(service.value.poolService1).toBeInstanceOf(PoolService);
    expect(service.value.poolService2).toBeInstanceOf(PoolService);
    expect(service.value.poolService3).toBeInstanceOf(PoolService);
    await service.destroy();

    service = injector.get(Service, Destroyable()) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);
    expect(service.value.poolService1).toBeInstanceOf(PoolService);
    expect(service.value.poolService2).toBeInstanceOf(PoolService);
    expect(service.value.poolService3).toBeInstanceOf(PoolService);
    await service.destroy();

    // only 4 because pool has capacity 2 and pool reuse given instances (two instances are created as redundant)
    expect(onInitCalls).toEqual(4);
    // 2 because two redundant instances are removed at the end
    expect(onDestroyCalls).toEqual(2);
  });

  test('should run onGetFromPool when instance is get from pool', async function () {
    let onInitCalls = 0;
    let onDestroyCalls = 0;
    let onGetFromPoolCalls = 0;
    let onReturnToPoolCalls = 0;

    @Injectable({
      scope: PooledScope({ capacity: 2 }),
    })
    class PoolService implements OnPool {
      constructor() {
        onInitCalls++;
      }

      onDestroy() {
        onDestroyCalls++;
      }

      onGetFromPool(): void | Promise<void> {
        onGetFromPoolCalls++;
      }

      onReturnToPool(): void | Promise<void> {
        onReturnToPoolCalls++;
      }
    }

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      constructor(
        readonly poolService1: PoolService,
        readonly poolService2: PoolService,
        readonly poolService3: PoolService,
      ) {}
    }

    const injector = Injector.create([
      PoolService,
      Service,
    ]).init() as Injector;

    let service = injector.get(Service, Destroyable()) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);
    expect(service.value.poolService1).toBeInstanceOf(PoolService);
    expect(service.value.poolService2).toBeInstanceOf(PoolService);
    expect(service.value.poolService3).toBeInstanceOf(PoolService);
    await service.destroy();

    service = injector.get(Service, Destroyable()) as unknown as DestroyableType<Service>;
    expect(service.value).toBeInstanceOf(Service);
    expect(service.value.poolService1).toBeInstanceOf(PoolService);
    expect(service.value.poolService2).toBeInstanceOf(PoolService);
    expect(service.value.poolService3).toBeInstanceOf(PoolService);
    await service.destroy();

    // only 4 because pool has capacity 2 and pool reuse given instances (two instances are created as redundant)
    expect(onInitCalls).toEqual(4);
    // 2 because two redundant instances are removed at the end
    expect(onDestroyCalls).toEqual(2);
    // 2 because two instances are saved in pool
    expect(onGetFromPoolCalls).toEqual(2);
    // 6 because two instances are saved in pool (2x times, and then retrieved) and two are destroyed
    expect(onReturnToPoolCalls).toEqual(6);
  });
});
