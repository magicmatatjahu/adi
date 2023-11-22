import { Injector, Inject, Injectable, Destroyable, DestroyableType, TransientScope } from "../../src";
import { wait } from "../helpers";

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
    ])
    
    let service = injector.getSync(Service, Destroyable())
    expect(service.value).toBeInstanceOf(Service);
    await service.destroy();

    service = injector.getSync(Service, Destroyable())
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
        @Inject(TransientService, Destroyable()) public testService1: DestroyableType<TransientService>,
        @Inject(TransientService, Destroyable()) public testService2: DestroyableType<TransientService>,
      ) {}
    }

    const injector = Injector.create([
      TransientService,
      Service,
    ])

    const service = injector.getSync(Service)
    expect(service).toBeInstanceOf(Service);
    expect(service.testService1.value).toBeInstanceOf(TransientService);
    expect(service.testService2.value).toBeInstanceOf(TransientService);
    
    await wait()
    service.testService1.destroy();
    service.testService2.destroy();
    expect(destroyTimes).toEqual(0);
  });
  
  test('should work with "using" statement - sync case', async function () {
    const destroyLabels: string[] = [];

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      onDestroy() {
        destroyLabels.push('onDestroy')
      }

      [Symbol.dispose]() {
        destroyLabels.push('dispose')
      }

      [Symbol.asyncDispose]() {
        destroyLabels.push('asyncDispose')
      }
    }

    const injector = Injector.create([
      Service,
    ])

    function destroy() {
      using service = injector.getSync(Service, Destroyable())
    }
    
    expect(destroyLabels).toEqual([]);
    destroy();
    await wait();
    expect(destroyLabels).toEqual(['dispose', 'asyncDispose', 'onDestroy']);
    destroy();
    await wait();
    expect(destroyLabels).toEqual(['dispose', 'asyncDispose', 'onDestroy', 'dispose', 'asyncDispose', 'onDestroy']);
  })

  test('should work with "using" statement - async case', async function () {
    const destroyLabels: string[] = [];

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      onDestroy() {
        destroyLabels.push('onDestroy')
      }

      [Symbol.dispose]() {
        destroyLabels.push('dispose')
      }

      [Symbol.asyncDispose]() {
        destroyLabels.push('asyncDispose')
      }
    }

    const injector = Injector.create([
      Service,
    ])

    async function destroy() {
      await using service = injector.getSync(Service, Destroyable())
    }
    
    expect(destroyLabels).toEqual([]);
    await destroy();
    expect(destroyLabels).toEqual(['dispose', 'asyncDispose', 'onDestroy']);
    await destroy();
    expect(destroyLabels).toEqual(['dispose', 'asyncDispose', 'onDestroy', 'dispose', 'asyncDispose', 'onDestroy']);
  })

  test('should work with "using" statement - sync case without dispose methods', async function () {
    const destroyLabels: string[] = [];

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      onDestroy() {
        destroyLabels.push('onDestroy')
      }
    }

    const injector = Injector.create([
      Service,
    ])

    function destroy() {
      using service = injector.getSync(Service, Destroyable())
    }
    
    expect(destroyLabels).toEqual([]);
    destroy();
    await wait();
    expect(destroyLabels).toEqual(['onDestroy']);
    destroy();
    await wait();
    expect(destroyLabels).toEqual(['onDestroy', 'onDestroy']);
  })

  test('should work with "using" statement - async case without dispose methods', async function () {
    const destroyLabels: string[] = [];

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      onDestroy() {
        destroyLabels.push('onDestroy')
      }
    }

    const injector = Injector.create([
      Service,
    ])

    async function destroy() {
      await using service = injector.getSync(Service, Destroyable())
    }
    
    expect(destroyLabels).toEqual([]);
    await destroy();
    expect(destroyLabels).toEqual(['onDestroy']);
    await destroy();
    expect(destroyLabels).toEqual(['onDestroy', 'onDestroy']);
  })
});
