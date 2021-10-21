import { Injector, Injectable, Inject, Ctx, Context, Scoped, Scope, STATIC_CONTEXT, OnDestroy, DestroyableType, Destroyable } from "../../src";

describe.skip('Transient scope', function () {
  test('should inject new instance per single injection', function () {
    @Injectable({
      scope: Scope.TRANSIENT,
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
    expect(service.service1 === service.service2).toEqual(false);
  });

  test('should have another Context than STATIC_CONTEXT', function () {
    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TestService {
      constructor(
        public readonly context: Context,
      ) {}
    }

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
    expect(service.service1 === service.service2).toEqual(false);
    expect(service.service1.context === STATIC_CONTEXT).toEqual(false);
    expect(service.service2.context === STATIC_CONTEXT).toEqual(false);
    expect(service.service1.context === service.service2.context).toEqual(false);
  });

  test('should by default inject passed custom Context (should behaves like Default scope)', function () {
    const ctx = new Context();

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TestService {
      constructor(
        public readonly context: Context,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly newService: TestService,
        @Inject(Ctx(ctx)) readonly ctxService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service);
    expect(service.newService).toBeInstanceOf(TestService);
    expect(service.ctxService).toBeInstanceOf(TestService);
    expect(service.newService === service.ctxService).toEqual(false);
    expect(service.newService.context === STATIC_CONTEXT).toEqual(false);
    expect(service.ctxService.context === ctx).toEqual(true);
  });

  test('should not use the passed custom Context if reuseContext option is set to false', function () {
    const ctx = new Context();

    @Injectable({
      scope: {
        kind: Scope.TRANSIENT,
        options: {
          reuseContext: false,
        }
      }
    })
    class TestService {
      constructor(
        public readonly context: Context,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly newService: TestService,
        @Inject(Ctx(ctx)) readonly ctxService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service);
    expect(service.newService).toBeInstanceOf(TestService);
    expect(service.ctxService).toBeInstanceOf(TestService);
    expect(service.newService === service.ctxService).toEqual(false);
    expect(service.newService.context === STATIC_CONTEXT).toEqual(false);
    expect(service.ctxService.context === ctx).toEqual(false);
  });

  test('should be able to be replaced by another scope', function () {
    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TestService {
      constructor(
        public readonly context: Context,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(Scoped(Scope.SINGLETON)) readonly singletonService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.singletonService).toBeInstanceOf(TestService);
    expect(service.service === service.singletonService).toEqual(false);
    expect(service.service.context === STATIC_CONTEXT).toEqual(false);
    expect(service.singletonService.context === STATIC_CONTEXT).toEqual(true);
  });

  describe('onDestroy hook', function () {
    test('should destroy after calling the method with method injection', async function() {
      let destroyTimes: number = 0;
  
      @Injectable({
        scope: Scope.TRANSIENT,
      })
      class TransientService implements OnDestroy {
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

    test('should destroy after calling the method with method injection (deep dependency graph case)' , async function() {
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

    test('should destroy using Destroyable interface - manually injection', async function () {
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
  
    test('should not destroy using Destroyable interface when instance has at least single reference link to the parent instance', async function () {
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

    test('should destroy only when long living instance is destroyed (using Singleton scope)', async function() {
      let destroyOrder: string[] = [];
  
      @Injectable({
        scope: Scope.TRANSIENT,
      })
      class TransientService implements OnDestroy {
        onDestroy() {
          destroyOrder.push('transient');
        }
      }
  
      @Injectable({
        scope: Scope.SINGLETON,
      })
      class Service {
        constructor(
          public service1: TransientService,
          public service2: TransientService,
        ) {}

        onDestroy() {
          destroyOrder.push('singleton');
        }
      }
  
      const injector = new Injector([
        TransientService,
        Service,
      ]);
  
      const service = injector.get(Service);
      expect(service).toBeInstanceOf(Service);

      await injector.destroy();
  
      // wait 100ms to resolve all promises in DestroyManager
      await new Promise(resolve => {
        setTimeout(() => {
          resolve(undefined);
        }, 100);
      });
      expect(destroyOrder).toEqual([
        'singleton',
        'transient',
        'transient',
      ]);
    });

    test('should not destroy when user pass custom context - default destroy event' , async function() {
      const ctx = new Context();

      let destroyTimes: number = 0;
  
      @Injectable({
        scope: Scope.TRANSIENT,
      })
      class TransientService implements OnDestroy {
        onDestroy() {
          destroyTimes++;
        }
      }
  
      @Injectable()
      class Service {
        @Inject()
        method(@Inject(Ctx(ctx)) service1?: TransientService, service2?: TransientService) {}
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
      // destroy 5 times the `service2` instance
      expect(destroyTimes).toEqual(5);
    });

    test('should destroy when user pass custom context on injector destruction - injector destroy event' , async function() {
      const ctx = new Context();

      let destroyTimes: number = 0;
  
      @Injectable({
        scope: Scope.TRANSIENT,
      })
      class TransientService implements OnDestroy {

        onDestroy() {
          destroyTimes++;
        }
      }
  
      @Injectable()
      class Service {
        @Inject()
        method(@Inject(Ctx(ctx)) service1?: TransientService, service2?: TransientService) {}
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
      // destroy 5 times the `service2` instance + 1 time service1
      expect(destroyTimes).toEqual(5);

      await injector.destroy();
  
      // wait 100ms to resolve all promises in DestroyManager
      await new Promise(resolve => {
        setTimeout(() => {
          resolve(undefined);
        }, 100);
      });
      // destroy 5 times the `service2` instance + 1 time service1
      expect(destroyTimes).toEqual(6);
    });
  });
});
