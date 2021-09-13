import { Injector, Injectable, Inject, Ctx, Context, Scoped, Scope, STATIC_CONTEXT, ANNOTATIONS, ref, OnDestroy, DestroyableType, Destroyable } from "../../src";

// TODO: Fix tests if scope has ability to pass custom options
describe('Instance scope', function () {
  test('should inject shared service in the given scope (using toScope option) - nearest case', function () {
    @Injectable({
      scope: {
        kind: Scope.LOCAL,
        options: {
          toScope: 'test',
        }
      }
    })
    class SharedService {}

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TempService {
      constructor(
        readonly shared1: SharedService,
        readonly shared2: SharedService,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
      annotations: {
        [ANNOTATIONS.LOCAL_SCOPE]: 'test'
      }
    })
    class ServiceBetween2 {
      constructor(
        readonly shared1: SharedService,
        readonly shared2: SharedService,
        readonly newService: TempService,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
      annotations: {
        [ANNOTATIONS.LOCAL_SCOPE]: 'test'
      }
    })
    class ServiceBetween1 {
      constructor(
        readonly shared1: SharedService,
        readonly shared2: SharedService,
        readonly betweenService: ServiceBetween2,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
      annotations: {
        [ANNOTATIONS.LOCAL_SCOPE]: 'test'
      }
    })
    class Service {
      constructor(
        readonly shared1: SharedService,
        readonly shared2: SharedService,
        readonly betweenService1: ServiceBetween1,
        readonly betweenService2: ServiceBetween1,
      ) {}
    }

    const injector = new Injector([
      SharedService,
      ServiceBetween1,
      ServiceBetween2,
      TempService,
      Service,
    ]);

    const service1 = injector.get(Service);
    const service2 = injector.get(Service);
    expect(service1 === service2).toEqual(false);
    expect(service1.shared1).toBeInstanceOf(SharedService);
    expect(service1.shared2).toBeInstanceOf(SharedService);
    expect(service1.shared1 === service1.shared2).toEqual(true);
    expect(service2.shared1 === service2.shared2).toEqual(true);
    expect(service1.shared1 === service2.shared1).toEqual(false);
    expect(service1.betweenService1.shared1).toBeInstanceOf(SharedService);
    expect(service1.betweenService1.shared2).toBeInstanceOf(SharedService);
    expect(service1.betweenService1.shared1 === service1.betweenService1.shared2).toEqual(true);
    expect(service1.betweenService2.shared1 === service1.betweenService2.shared2).toEqual(true);
    expect(service1.betweenService1.shared1 === service2.betweenService1.shared1).toEqual(false);
    expect(service1.shared1 === service1.betweenService1.shared1).toEqual(false);
    expect(service1.shared1 === service1.betweenService1.shared2).toEqual(false);
    expect(service1.betweenService1.shared1 === service1.betweenService2.shared1).toEqual(false);
    expect(service1.betweenService1.betweenService.shared1).toBeInstanceOf(SharedService);
    expect(service1.betweenService1.betweenService.shared2).toBeInstanceOf(SharedService);
    expect(service1.betweenService1.betweenService.shared1 === service1.betweenService1.betweenService.shared2).toEqual(true);
    expect(service1.betweenService2.betweenService.shared1 === service1.betweenService2.betweenService.shared2).toEqual(true);
    expect(service1.betweenService1.betweenService.shared1 === service2.betweenService1.betweenService.shared1).toEqual(false);
    expect(service1.betweenService1.shared1 === service1.betweenService1.betweenService.shared1).toEqual(false);
    expect(service1.betweenService2.shared1 === service1.betweenService2.betweenService.shared1).toEqual(false);
    expect(service1.betweenService1.betweenService.newService.shared1).toBeInstanceOf(SharedService);
    expect(service1.betweenService1.betweenService.newService.shared2).toBeInstanceOf(SharedService);
    expect(service1.betweenService1.betweenService.shared1 === service1.betweenService1.betweenService.newService.shared1).toEqual(true);
    expect(service1.betweenService1.betweenService.shared1 === service1.betweenService1.betweenService.newService.shared2).toEqual(true);
    expect(service1.betweenService2.betweenService.shared1 === service1.betweenService2.betweenService.newService.shared1).toEqual(true);
    expect(service1.betweenService2.betweenService.shared1 === service1.betweenService2.betweenService.newService.shared2).toEqual(true);
    expect(service1.betweenService1.betweenService.shared1 === service1.betweenService2.betweenService.newService.shared1).toEqual(false);
    expect(service1.shared1 === service1.betweenService2.betweenService.newService.shared1).toEqual(false);
    expect(service2.shared1 === service1.betweenService2.betweenService.newService.shared1).toEqual(false);
  });

  test('should inject shared service in the given scope (using toScope option) - farthest case', function () {
    @Injectable({
      scope: {
        kind: Scope.LOCAL,
        options: {
          toScope: 'test',
          depth: 'farthest',
        }
      }
    })
    class SharedService {}

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TempService {
      constructor(
        readonly shared1: SharedService,
        readonly shared2: SharedService,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
      annotations: {
        [ANNOTATIONS.LOCAL_SCOPE]: 'test'
      }
    })
    class ServiceBetween2 {
      constructor(
        readonly shared1: SharedService,
        readonly shared2: SharedService,
        readonly newService: TempService,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
      annotations: {
        [ANNOTATIONS.LOCAL_SCOPE]: 'test'
      }
    })
    class ServiceBetween1 {
      constructor(
        readonly shared1: SharedService,
        readonly shared2: SharedService,
        readonly betweenService: ServiceBetween2,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
      annotations: {
        [ANNOTATIONS.LOCAL_SCOPE]: 'test'
      }
    })
    class Service {
      constructor(
        readonly shared1: SharedService,
        readonly shared2: SharedService,
        readonly betweenService1: ServiceBetween1,
        readonly betweenService2: ServiceBetween1,
      ) {}
    }

    const injector = new Injector([
      SharedService,
      ServiceBetween1,
      ServiceBetween2,
      TempService,
      Service,
    ]);

    const service1 = injector.get(Service);
    const service2 = injector.get(Service);
    expect(service1 === service2).toEqual(false);
    expect(service1.shared1).toBeInstanceOf(SharedService);
    expect(service1.shared2).toBeInstanceOf(SharedService);
    expect(service1.shared1 === service1.shared2).toEqual(true);
    expect(service2.shared1 === service2.shared2).toEqual(true);
    expect(service1.shared1 === service2.shared1).toEqual(false);
    expect(service1.betweenService1.shared1).toBeInstanceOf(SharedService);
    expect(service1.betweenService1.shared2).toBeInstanceOf(SharedService);
    expect(service1.betweenService1.shared1 === service1.betweenService1.shared2).toEqual(true);
    expect(service1.betweenService2.shared1 === service1.betweenService2.shared2).toEqual(true);
    expect(service1.betweenService1.shared1 === service2.betweenService1.shared1).toEqual(false);
    expect(service1.shared1 === service1.betweenService1.shared1).toEqual(true);
    expect(service1.shared1 === service1.betweenService1.shared2).toEqual(true);
    expect(service1.betweenService1.shared1 === service1.betweenService2.shared1).toEqual(true);
    expect(service1.betweenService1.betweenService.shared1).toBeInstanceOf(SharedService);
    expect(service1.betweenService1.betweenService.shared2).toBeInstanceOf(SharedService);
    expect(service1.betweenService1.betweenService.shared1 === service1.betweenService1.betweenService.shared2).toEqual(true);
    expect(service1.betweenService2.betweenService.shared1 === service1.betweenService2.betweenService.shared2).toEqual(true);
    expect(service1.betweenService1.betweenService.shared1 === service2.betweenService1.betweenService.shared1).toEqual(false);
    expect(service1.betweenService1.shared1 === service1.betweenService1.betweenService.shared1).toEqual(true);
    expect(service1.betweenService2.shared1 === service1.betweenService2.betweenService.shared1).toEqual(true);
    expect(service1.betweenService1.betweenService.newService.shared1).toBeInstanceOf(SharedService);
    expect(service1.betweenService1.betweenService.newService.shared2).toBeInstanceOf(SharedService);
    expect(service1.betweenService1.betweenService.shared1 === service1.betweenService1.betweenService.newService.shared1).toEqual(true);
    expect(service1.betweenService1.betweenService.shared1 === service1.betweenService1.betweenService.newService.shared2).toEqual(true);
    expect(service1.betweenService2.betweenService.shared1 === service1.betweenService2.betweenService.newService.shared1).toEqual(true);
    expect(service1.betweenService2.betweenService.shared1 === service1.betweenService2.betweenService.newService.shared2).toEqual(true);
    expect(service1.betweenService1.betweenService.shared1 === service1.betweenService2.betweenService.newService.shared1).toEqual(true);
    expect(service1.shared1 === service1.betweenService2.betweenService.newService.shared1).toEqual(true);
    expect(service2.shared1 === service1.betweenService2.betweenService.newService.shared1).toEqual(false);
  });

  test('should inject shared service in the given scope (using toScope option) - custom depth case', function () {
    @Injectable({
      scope: {
        kind: Scope.LOCAL,
        options: {
          toScope: 'test',
          depth: 2,
        }
      }
    })
    class SharedService {}

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TempService {
      constructor(
        readonly shared1: SharedService,
        readonly shared2: SharedService,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
      annotations: {
        [ANNOTATIONS.LOCAL_SCOPE]: 'test'
      }
    })
    class ServiceBetween2 {
      constructor(
        readonly shared1: SharedService,
        readonly shared2: SharedService,
        readonly newService: TempService,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
      annotations: {
        [ANNOTATIONS.LOCAL_SCOPE]: 'test'
      }
    })
    class ServiceBetween1 {
      constructor(
        readonly shared1: SharedService,
        readonly shared2: SharedService,
        readonly betweenService: ServiceBetween2,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
      annotations: {
        [ANNOTATIONS.LOCAL_SCOPE]: 'test'
      }
    })
    class Service {
      constructor(
        readonly shared1: SharedService,
        readonly shared2: SharedService,
        readonly betweenService1: ServiceBetween1,
        readonly betweenService2: ServiceBetween1,
      ) {}
    }

    const injector = new Injector([
      SharedService,
      ServiceBetween1,
      ServiceBetween2,
      TempService,
      Service,
    ]);

    const service1 = injector.get(Service);
    const service2 = injector.get(Service);
    expect(service1 === service2).toEqual(false);
    expect(service1.shared1).toBeInstanceOf(SharedService);
    expect(service1.shared2).toBeInstanceOf(SharedService);
    expect(service1.shared1 === service1.shared2).toEqual(true);
    expect(service2.shared1 === service2.shared2).toEqual(true);
    expect(service1.shared1 === service2.shared1).toEqual(false);
    expect(service1.betweenService1.shared1).toBeInstanceOf(SharedService);
    expect(service1.betweenService1.shared2).toBeInstanceOf(SharedService);
    expect(service1.betweenService1.shared1 === service1.betweenService1.shared2).toEqual(true);
    expect(service1.betweenService2.shared1 === service1.betweenService2.shared2).toEqual(true);
    expect(service1.betweenService1.shared1 === service2.betweenService1.shared1).toEqual(false);
    expect(service1.shared1 === service1.betweenService1.shared1).toEqual(true);
    expect(service1.shared1 === service1.betweenService1.shared2).toEqual(true);
    expect(service1.betweenService1.shared1 === service1.betweenService2.shared1).toEqual(true);
    expect(service1.betweenService1.betweenService.shared1).toBeInstanceOf(SharedService);
    expect(service1.betweenService1.betweenService.shared2).toBeInstanceOf(SharedService);
    expect(service1.betweenService1.betweenService.shared1 === service1.betweenService1.betweenService.shared2).toEqual(true);
    expect(service1.betweenService2.betweenService.shared1 === service1.betweenService2.betweenService.shared2).toEqual(true);
    expect(service1.betweenService1.betweenService.shared1 === service2.betweenService1.betweenService.shared1).toEqual(false);
    expect(service1.betweenService1.shared1 === service1.betweenService1.betweenService.shared1).toEqual(false);
    expect(service1.betweenService2.shared1 === service1.betweenService2.betweenService.shared1).toEqual(false);
    expect(service1.betweenService1.betweenService.newService.shared1).toBeInstanceOf(SharedService);
    expect(service1.betweenService1.betweenService.newService.shared2).toBeInstanceOf(SharedService);
    expect(service1.betweenService1.betweenService.shared1 === service1.betweenService1.betweenService.newService.shared1).toEqual(true);
    expect(service1.betweenService1.betweenService.shared1 === service1.betweenService1.betweenService.newService.shared2).toEqual(true);
    expect(service1.betweenService2.betweenService.shared1 === service1.betweenService2.betweenService.newService.shared1).toEqual(true);
    expect(service1.betweenService2.betweenService.shared1 === service1.betweenService2.betweenService.newService.shared2).toEqual(true);
    expect(service1.betweenService1.betweenService.shared1 === service1.betweenService2.betweenService.newService.shared1).toEqual(false);
    expect(service1.betweenService1.shared1 === service1.betweenService2.betweenService.newService.shared1).toEqual(false);
    expect(service1.shared1 === service1.betweenService2.betweenService.newService.shared1).toEqual(false);
    expect(service2.shared1 === service1.betweenService2.betweenService.newService.shared1).toEqual(false);
  });

  test('should inject shared service in the given scope (using toToken option)', function () {
    @Injectable({
      scope: {
        kind: Scope.LOCAL,
        options: {
          toToken: ref(() => ServiceBetween),
        }
      }
    })
    class SharedService {}

    @Injectable({
      scope: Scope.TRANSIENT
    })
    class ServiceBetween {
      constructor(
        readonly shared1: SharedService,
        readonly shared2: SharedService,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT
    })
    class Service {
      constructor(
        readonly shared: SharedService,
        readonly between1: ServiceBetween,
        readonly between2: ServiceBetween,
      ) {}
    }

    const injector = new Injector([
      Service,
      ServiceBetween,
      SharedService,
    ]);

    const service1 = injector.get(Service);
    const service2 = injector.get(Service);
    expect(service1 === service2).toEqual(false);
    expect(service1.between1).toBeInstanceOf(ServiceBetween);
    expect(service2.between1).toBeInstanceOf(ServiceBetween);
    expect(service1.shared).toBeInstanceOf(SharedService);
    expect(service1.shared === service1.between1.shared1).toEqual(false);
    expect(service1.shared === service1.between1.shared2).toEqual(false);
    expect(service1.shared === service1.between2.shared1).toEqual(false);
    expect(service1.shared === service1.between2.shared2).toEqual(false);
    expect(service1.between1.shared1 === service1.between1.shared2).toEqual(true);
    expect(service1.between2.shared1 === service1.between2.shared2).toEqual(true);
    expect(service1.between1.shared1 === service1.between2.shared1).toEqual(false);
  });

  test('should inject shared service in the given scope (using toScope and toAnnotation options)', function () {
    @Injectable({
      scope: {
        kind: Scope.LOCAL,
        options: {
          toScope: 'test',
          customAnnotation: '@test/annotation'
        }
      }
    })
    class SharedService {}

    @Injectable({
      scope: Scope.TRANSIENT,
      annotations: {
        '@test/annotation': 'test',
      }
    })
    class ServiceBetween {
      constructor(
        readonly shared1: SharedService,
        readonly shared2: SharedService,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT
    })
    class Service {
      constructor(
        readonly shared: SharedService,
        readonly between1: ServiceBetween,
        readonly between2: ServiceBetween,
      ) {}
    }

    const injector = new Injector([
      Service,
      ServiceBetween,
      SharedService,
    ]);

    const service1 = injector.get(Service);
    const service2 = injector.get(Service);
    expect(service1 === service2).toEqual(false);
    expect(service1.between1).toBeInstanceOf(ServiceBetween);
    expect(service2.between1).toBeInstanceOf(ServiceBetween);
    expect(service1.shared).toBeInstanceOf(SharedService);
    expect(service1.shared === service1.between1.shared1).toEqual(false);
    expect(service1.shared === service1.between1.shared2).toEqual(false);
    expect(service1.shared === service1.between2.shared1).toEqual(false);
    expect(service1.shared === service1.between2.shared2).toEqual(false);
    expect(service1.between1.shared1 === service1.between1.shared2).toEqual(true);
    expect(service1.between2.shared1 === service1.between2.shared2).toEqual(true);
    expect(service1.between1.shared1 === service1.between2.shared1).toEqual(false);
  });

  test('should inject shared service in the given scope when LOCAL scope has not passed any options but scope token exists in subgraph', function () {
    @Injectable({
      scope: Scope.LOCAL,
    })
    class SharedService {}

    @Injectable({
      scope: Scope.TRANSIENT,
      annotations: {
        [ANNOTATIONS.LOCAL_SCOPE]: 'test'
      }
    })
    class ServiceBetween {
      constructor(
        readonly shared1: SharedService,
        readonly shared2: SharedService,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT
    })
    class Service {
      constructor(
        readonly shared: SharedService,
        readonly between1: ServiceBetween,
        readonly between2: ServiceBetween,
      ) {}
    }

    const injector = new Injector([
      Service,
      ServiceBetween,
      SharedService,
    ]);

    const service1 = injector.get(Service);
    const service2 = injector.get(Service);
    expect(service1 === service2).toEqual(false);
    expect(service1.between1).toBeInstanceOf(ServiceBetween);
    expect(service2.between1).toBeInstanceOf(ServiceBetween);
    expect(service1.shared).toBeInstanceOf(SharedService);
    expect(service1.shared === service1.between1.shared1).toEqual(false);
    expect(service1.shared === service1.between1.shared2).toEqual(false);
    expect(service1.shared === service1.between2.shared1).toEqual(false);
    expect(service1.shared === service1.between2.shared2).toEqual(false);
    expect(service1.between1.shared1 === service1.between1.shared2).toEqual(true);
    expect(service1.between2.shared1 === service1.between2.shared2).toEqual(true);
    expect(service1.between1.shared1 === service1.between2.shared1).toEqual(false);
  });

  test('should behaves as Singleton scope if any ancestor has not defined the toScope and toToken options', function () {
    @Injectable({
      scope: Scope.LOCAL,
    })
    class TestService {
      constructor(
        public readonly context: Context,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
    })
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

    const service1 = injector.get(Service);
    const service2 = injector.get(Service);
    expect(service1 === service2).toEqual(false);
    expect(service1.service1).toBeInstanceOf(TestService);
    expect(service1.service2).toBeInstanceOf(TestService);
    expect(service1.service1 === service1.service2).toEqual(true);
    expect(service1.service1.context === STATIC_CONTEXT).toEqual(true);
    expect(service1.service2.context === STATIC_CONTEXT).toEqual(true);
    expect(service1.service1.context === service1.service2.context).toEqual(true);
    expect(service1.service1 === service2.service1).toEqual(true);
    expect(service1.service2 === service2.service2).toEqual(true);
  });

  test('should by default inject passed custom Context (should behaves like Default scope)', function () {
    const ctx = new Context();

    @Injectable({
      scope: Scope.LOCAL,
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
        @Inject(Ctx(ctx)) readonly ctxService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.ctxService).toBeInstanceOf(TestService);
    expect(service.service === service.ctxService).toEqual(false);
    expect(service.service.context === STATIC_CONTEXT).toEqual(true);
    expect(service.ctxService.context === ctx).toEqual(true);
  });

  test('should not use the passed custom Context if reuseContext option is set to false', function () {
    const ctx = new Context();

    @Injectable({
      scope: {
        kind: Scope.LOCAL,
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
        readonly service: TestService,
        @Inject(Ctx(ctx)) readonly ctxService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.ctxService).toBeInstanceOf(TestService);
    expect(service.service === service.ctxService).toEqual(true);
    expect(service.service.context === STATIC_CONTEXT).toEqual(true);
    expect(service.ctxService.context === STATIC_CONTEXT).toEqual(true);
  });

  test('should be able to be replaced by another scope', function () {
    @Injectable({
      scope: Scope.LOCAL,
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
        @Inject(Scoped(Scope.TRANSIENT)) readonly newService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.newService).toBeInstanceOf(TestService);
    expect(service.service === service.newService).toEqual(false);
    expect(service.service.context === STATIC_CONTEXT).toEqual(true);
    expect(service.newService.context === STATIC_CONTEXT).toEqual(false);
  });

  describe('onDestroy hook', function () {
    test('should destroy only when parent instance is destroyed (using Transient scope in parent instance)', async function() {
      let destroyOrder: string[] = [];
  
      @Injectable({
        scope: {
          kind: Scope.LOCAL,
          options: {
            toScope: 'test',
          }
        }
      })
      class LocalService implements OnDestroy {
        onDestroy() {
          destroyOrder.push('local');
        }
      }
  
      @Injectable({
        scope: Scope.TRANSIENT,
        annotations: {
          [ANNOTATIONS.LOCAL_SCOPE]: 'test'
        }
      })
      class Service implements OnDestroy {
        constructor(
          readonly shared1: LocalService,
          readonly shared2: LocalService,
        ) {}

        onDestroy() {
          destroyOrder.push('transient');
        }
      }
  
      const injector = new Injector([
        LocalService,
        Service,
      ]);
  
      injector.get(Service);
      injector.get(Service);

      await injector.destroy();
  
      // wait 100ms to resolve all promises in DestroyManager
      await new Promise(resolve => {
        setTimeout(() => {
          resolve(undefined);
        }, 100);
      });
      expect(destroyOrder).toEqual([
        'transient',
        'local',
        'transient',
        'local',
      ]);
    });

    test('should not destroy using Destroyable interface when instance has at least single reference link to the parent instance', async function () {
      let destroyTimes: number = 0;
  
      @Injectable({
        scope: {
          kind: Scope.LOCAL,
          options: {
            toScope: 'test',
          }
        }
      })
      class LocalService implements OnDestroy {
        onDestroy() {
          destroyTimes++;
        }
      }
  
      @Injectable({
        annotations: {
          [ANNOTATIONS.LOCAL_SCOPE]: 'test'
        }
      })
      class Service {
        constructor(
          @Inject(LocalService, Destroyable()) public testService1: DestroyableType<LocalService>,
          @Inject(LocalService, Destroyable()) public testService2: DestroyableType<LocalService>,
        ) {}
      }
  
      const injector = new Injector([
        LocalService,
        Service,
      ]);
  
      const service = injector.get(Service);
      expect(service).toBeInstanceOf(Service);
      expect(service.testService1.value).toBeInstanceOf(LocalService);
      expect(service.testService2.value).toBeInstanceOf(LocalService);
  
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

    test('should destroy using Destroyable interface - manually injection (treat scope as Transient)', async function () {
      let destroyTimes: number = 0;
  
      @Injectable({
        scope: Scope.INSTANCE,
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

    test('should destroy using Destroyable interface - manually injection using as parent the Transient scope', async function () {
      let destroyOrder: string[] = [];
  
      @Injectable({
        scope: {
          kind: Scope.LOCAL,
          options: {
            toScope: 'test',
          }
        }
      })
      class LocalInstance implements OnDestroy {
        onDestroy() {
          destroyOrder.push('local');
        }
      }

      @Injectable({
        scope: Scope.TRANSIENT,
        annotations: {
          [ANNOTATIONS.LOCAL_SCOPE]: 'test'
        }
      })
      class Service implements OnDestroy {
        constructor(
          public service1: LocalInstance,
          public service2: LocalInstance,
        ) {}

        onDestroy() {
          destroyOrder.push('transient');
        }
      }
  
      const injector = new Injector([
        LocalInstance,
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
      expect(destroyOrder).toEqual(['transient', 'local', 'transient', 'local']);
    });

    test('should not destroy in method injection' , async function() {
      let destroyTimes: number = 0;
  
      @Injectable({
        scope: {
          kind: Scope.LOCAL,
          options: {
            toScope: 'test',
          }
        }
      })
      class LocalService implements OnDestroy {
        onDestroy() {
          destroyTimes++;
        }
      }
  
      @Injectable({
        annotations: {
          [ANNOTATIONS.LOCAL_SCOPE]: 'test'
        }
      })
      class Service {
        @Inject()
        method(service1?: LocalService, service2?: LocalService) {}
      }
  
      const injector = new Injector([
        LocalService,
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
      expect(destroyTimes).toEqual(0);
    });

    test('should not destroy when user pass custom context - default destroy event (treat scope as Transient)' , async function() {
      let destroyOrder: string[] = [];
      const localCtx = new Context(undefined, 'Local ctx');
  
      @Injectable({
        scope: {
          kind: Scope.LOCAL,
          options: {
            toScope: 'test',
          }
        }
      })
      class LocalService implements OnDestroy {
        onDestroy() {
          destroyOrder.push('local');
        }
      }
  
      @Injectable({
        scope: Scope.TRANSIENT,
        annotations: {
          [ANNOTATIONS.LOCAL_SCOPE]: 'test'
        }
      })
      class TransientInstance implements OnDestroy {
        constructor(
          @Inject(Ctx(localCtx)) public ctxService: LocalService,
          public service: LocalService,
        ) {}

        onDestroy() {
          destroyOrder.push('transient');
        }
      }

      @Injectable({
        scope: Scope.SINGLETON,
      })
      class Service implements OnDestroy {
        @Inject()
        method(service?: TransientInstance) {}

        onDestroy() {
          destroyOrder.push('singleton');
        }
      }
  
      const injector = new Injector([
        LocalService,
        TransientInstance,
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

      expect(destroyOrder).toEqual(['transient', 'local']);

      await injector.destroy();
  
      // last instance is from TransientInstance created by 'instanceCtx' context
      expect(destroyOrder).toEqual(['transient', 'local', 'singleton', 'local']);
    });
  });
});
