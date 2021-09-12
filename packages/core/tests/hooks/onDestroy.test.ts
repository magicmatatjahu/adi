import { Injector, Injectable, Inject, Scope } from "../../src";

describe('onDestroy', function() {
  test('should works in method injection', async function() {
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
      @Inject()
      method(service1?: TransientService, service2?: TransientService) {}
    }

    const injector = new Injector([
      TransientService,
      Service,
    ]);

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    service.method();
    service.method();
    service.method();
    service.method();
    service.method(); // call five times method

    // wait 100ms to resolve all promises in DestroyManager
    await new Promise(resolve => {
      setTimeout(() => {
        resolve(undefined);
      }, 100);
    });
    expect(destroyTimes).toEqual(10);
  });

  test('should works in method injection - case with deep dependencies', async function() {
    let destroyTimes: number = 0;
    let destroyOrder: string[] = [];

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class DeepTransientService {
      onDestroy() {
        destroyTimes++;
        destroyOrder.push('deepTransient');
      }
    }

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TransientService {
      constructor(
        public service: DeepTransientService,
      ) {}

      onDestroy() {
        destroyTimes++;
        destroyOrder.push('transient');
      }
    }

    @Injectable()
    class Service {
      @Inject()
      method(service?: TransientService) {}
    }

    const injector = new Injector([
      DeepTransientService,
      TransientService,
      Service,
    ]);

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    
    service.method();
    // wait 100ms to resolve all promises in DestroyManager
    await new Promise(resolve => {
      setTimeout(() => {
        resolve(undefined);
      }, 100);
    });
    expect(destroyTimes).toEqual(2);
    expect(destroyOrder).toEqual([
      'transient',
      'deepTransient',
    ]);

    // call second time
    service.method();
    // wait 100ms to resolve all promises in DestroyManager
    await new Promise(resolve => {
      setTimeout(() => {
        resolve(undefined);
      }, 100);
    });
    expect(destroyTimes).toEqual(4);
    expect(destroyOrder).toEqual([
      'transient',
      'deepTransient',
      'transient',
      'deepTransient',
    ]);

    // call third time
    service.method();
    // wait 100ms to resolve all promises in DestroyManager
    await new Promise(resolve => {
      setTimeout(() => {
        resolve(undefined);
      }, 100);
    });
    expect(destroyTimes).toEqual(6);
    expect(destroyOrder).toEqual([
      'transient',
      'deepTransient',
      'transient',
      'deepTransient',
      'transient',
      'deepTransient',
    ]);
  });
});
