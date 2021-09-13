import { Injector, Injectable, Inject, Ctx, Context, Scoped, Scope, OnDestroy, DestroyableType, Destroyable } from "../../src";

describe('Singleton scope', function () {
  test('should always inject this same value', function () {
    @Injectable({
      scope: Scope.SINGLETON,
    })
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service1: TestService,
        readonly service2: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service);
    expect(service.service1).toBeInstanceOf(TestService);
    expect(service.service2).toBeInstanceOf(TestService);
    expect(service.service1 === service.service2).toEqual(true);
  });

  test('should throw error if custom Context (not STATIC_CONTEXT) is passed', function () {
    const ctx = new Context();

    @Injectable({
      scope: Scope.SINGLETON,
    })
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        public readonly service: TestService,
        @Inject(Ctx(ctx)) readonly ctxService1: TestService,
        @Inject(Ctx(ctx)) readonly ctxService2: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    let error: any, instance: Service;
    try {
      instance = injector.get(Service);
    } catch(err) {
      error = err;
    }
    expect(error === undefined).toEqual(false);
    expect(instance === undefined).toEqual(true);
  }); 

  test('should not be able to be replaced by another scope', function () {
    @Injectable({
      scope: Scope.SINGLETON,
    })
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(Scoped(Scope.SINGLETON)) readonly oldService: TestService,
        @Inject(Scoped(Scope.TRANSIENT)) readonly probablyNewService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.oldService).toBeInstanceOf(TestService);
    expect(service.probablyNewService).toBeInstanceOf(TestService);
    expect(service.service === service.oldService).toEqual(true);
    expect(service.service === service.probablyNewService).toEqual(true);
  });

  describe('onDestroy hook', function () {
    test('should destroy on injector event' , async function() {
      let destroyOrder: string[] = [];

      @Injectable({
        scope: Scope.SINGLETON,
      })
      class TestService {
        onDestroy() {
          destroyOrder.push('testService');
        }
      }
  
      @Injectable({
        scope: Scope.SINGLETON,
      })
      class Service implements OnDestroy {
        constructor(
          readonly service1: TestService,
          readonly service2: TestService,
        ) {}

        onDestroy() {
          destroyOrder.push('service');
        }
      }
  
      const injector = Injector.create([
        Service,
        TestService,
      ]);

      injector.get(Service);
      injector.get(Service);

      await injector.destroy();

      expect(destroyOrder).toEqual(['service', 'testService']);
    });

    test('should not destroy on manually event' , async function() {
      let destroyOrder: string[] = [];

      @Injectable({
        scope: Scope.SINGLETON,
      })
      class SingletonService {
        onDestroy() {
          destroyOrder.push('singleton');
        }
      }
  
      @Injectable({
        scope: Scope.TRANSIENT,
      })
      class TransientService implements OnDestroy {
        constructor(
          readonly service1: SingletonService,
        ) {}

        onDestroy() {
          destroyOrder.push('transient');
        }
      }
  
      const injector = Injector.create([
        SingletonService,
        TransientService,
      ]);

      let service: DestroyableType<TransientService> = injector.get(TransientService, Destroyable()) as unknown as DestroyableType<TransientService>;
      expect(service.value).toBeInstanceOf(TransientService);
      await service.destroy();
  
      service = injector.get(TransientService, Destroyable()) as unknown as DestroyableType<TransientService>;
      expect(service.value).toBeInstanceOf(TransientService);
      await service.destroy();
  
      // wait 100ms to resolve all promises in DestroyManager
      await new Promise(resolve => {
        setTimeout(() => {
          resolve(undefined);
        }, 100);
      });

      expect(destroyOrder).toEqual(['transient', 'transient']);
      await injector.destroy();
      expect(destroyOrder).toEqual(['transient', 'transient', 'singleton']);
    });
  });
});
