import { Injector, Injectable, Scope, Inject, Context, Session, DestroyManager } from "../../src";

describe('Request scope', function () {
  test('should create new instance by each resolution', function () {
    @Injectable({
      scope: Scope.REQUEST,
    })
    class RequestService {}

    @Injectable()
    class Service {
      public createdTimes: number = 0;

      constructor(
        readonly requestService: RequestService,
      ) {
        this.createdTimes++;
      }
    }

    const injector = Injector.create([
      Service,
      RequestService,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.requestService).toBeInstanceOf(RequestService);
    expect(service.createdTimes).toEqual(1);
      
    const oldService1 = service;
    service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.requestService).toBeInstanceOf(RequestService);
    expect(service === oldService1).toEqual(false); // because they are proxies
    expect(service.createdTimes).toEqual(1);
    expect(service.requestService === oldService1.requestService).toEqual(false);

    const oldService2 = service;
    service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.requestService).toBeInstanceOf(RequestService);
    expect(service === oldService1).toEqual(false); // because they are proxies
    expect(service === oldService2).toEqual(false); // because they are proxies
    expect(service.createdTimes).toEqual(1);
    expect(service.requestService === oldService1.requestService).toEqual(false);
    expect(service.requestService === oldService2.requestService).toEqual(false);
    expect(oldService1.requestService === oldService2.requestService).toEqual(false);
  });

  test('should create new instance by each resolution - deep case', function () {
    @Injectable({
      scope: Scope.REQUEST,
    })
    class RequestService {}

    @Injectable()
    class DeepService {
      public createdTimes: number = 0;

      constructor(
        readonly requestService: RequestService,
      ) {
        this.createdTimes++;
      }
    }

    @Injectable()
    class Service {
      public createdTimes: number = 0;

      constructor(
        readonly deepService: DeepService,
      ) {
        this.createdTimes++;
      }
    }

    const injector = Injector.create([
      Service,
      DeepService,
      RequestService,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
    expect(service.deepService.createdTimes).toEqual(1);
    expect(service.deepService.requestService).toBeInstanceOf(RequestService);
    expect(service.createdTimes).toEqual(1);

    const oldService1 = service;
    service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
    expect(service.deepService.requestService).toBeInstanceOf(RequestService);
    expect(service === oldService1).toEqual(false); // because they are proxies
    expect(service.createdTimes).toEqual(1);
    expect(service.deepService === oldService1.deepService).toEqual(false); // because they are proxies
    expect(service.deepService.createdTimes).toEqual(1);
    expect(service.deepService.requestService === oldService1.deepService.requestService).toEqual(false);

    const oldService2 = service;
    service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
    expect(service.deepService.requestService).toBeInstanceOf(RequestService);
    expect(service === oldService2).toEqual(false); // because they are proxies
    expect(service.createdTimes).toEqual(1);
    expect(service.deepService === oldService2.deepService).toEqual(false); // because they are proxies
    expect(service.deepService.createdTimes).toEqual(1);
    expect(service.deepService.requestService === oldService1.deepService.requestService).toEqual(false);
    expect(service.deepService.requestService === oldService2.deepService.requestService).toEqual(false);
    expect(oldService1.deepService.requestService === oldService2.deepService.requestService).toEqual(false);
  });

  test('should share this same instance', function () {
    @Injectable({
      scope: Scope.REQUEST,
    })
    class RequestService {}

    @Injectable()
    class DeepService {
      public createdTimes: number = 0;

      constructor(
        readonly requestService: RequestService,
      ) {
        this.createdTimes++;
      }
    }

    @Injectable()
    class Service {
      public createdTimes: number = 0;

      constructor(
        readonly deepService: DeepService,
        readonly requestService: RequestService,
      ) {
        this.createdTimes++;
      }
    }

    const injector = Injector.create([
      Service,
      DeepService,
      RequestService,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
    expect(service.requestService).toBeInstanceOf(RequestService);
    expect(service.deepService.createdTimes).toEqual(1);
    expect(service.deepService.requestService).toBeInstanceOf(RequestService);
    expect(service.requestService === service.deepService.requestService).toEqual(false); // because they are proxies
    // expect(service.requestService === service.deepService.requestService).toEqual(true);
    expect(service.createdTimes).toEqual(1);

    const oldService1 = service;
    service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
    expect(service.requestService).toBeInstanceOf(RequestService);
    expect(service.deepService.requestService).toBeInstanceOf(RequestService);
    expect(service === oldService1).toEqual(false); // because they are proxies
    expect(service.createdTimes).toEqual(1);
    expect(service.deepService === oldService1.deepService).toEqual(false); // because they are proxies
    expect(service.deepService.createdTimes).toEqual(1);
    expect(service.requestService === service.deepService.requestService).toEqual(false); // because they are proxies
    // expect(service.requestService === service.deepService.requestService).toEqual(true);
    expect(oldService1.requestService === oldService1.deepService.requestService).toEqual(false); // because they are proxies
    // expect(oldService1.requestService === oldService1.deepService.requestService).toEqual(true);
    expect(service.requestService === oldService1.requestService).toEqual(false);
    expect(service.deepService.requestService === oldService1.deepService.requestService).toEqual(false);
  });

  test('should handle normal non requested services', function () {
    @Injectable()
    class NormalService {
      public createdTimes: number = 0;

      constructor() {
        this.createdTimes++;
      }
    }

    @Injectable({
      scope: Scope.REQUEST,
    })
    class RequestService {
      constructor(
        readonly normalService: NormalService,
      ) {}

      method() {
        return this.normalService;
      }
    }

    @Injectable()
    class Service {
      constructor(
        readonly requestService: RequestService,
        readonly normalService: NormalService,
      ) {}

      method() {
        return this.normalService;
      }
    }

    const injector = Injector.create([
      Service,
      NormalService,
      RequestService,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.requestService).toBeInstanceOf(RequestService);
    expect(service.normalService).toBeInstanceOf(NormalService);
    expect(service.method()).toBeInstanceOf(NormalService);
    expect(service.method() === service.normalService).toEqual(false); // because they are proxies
    // expect(service.method() === service.requestService).toEqual(true);
    expect(service.normalService.createdTimes).toEqual(1);
    expect(service.method().createdTimes).toEqual(1);
    expect(service.requestService.normalService).toBeInstanceOf(NormalService);
    expect(service.requestService.method()).toBeInstanceOf(NormalService);
    expect(service.requestService.method() === service.requestService.normalService).toEqual(false); // because they are proxies
    // expect(service.requestService.method() === service.requestService.normalService).toEqual(true);
    expect(service.requestService.normalService.createdTimes).toEqual(1);
    expect(service.requestService.method().createdTimes).toEqual(1);
  });

  test('should handle this argument', function () {
    @Injectable({
      scope: Scope.REQUEST,
    })
    class RequestService {}

    @Injectable()
    class Service {
      constructor(
        readonly requestService: RequestService,
      ) {}

      method() {
        return this.requestService;
      }
    }

    const injector = Injector.create([
      Service,
      RequestService,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.requestService).toBeInstanceOf(RequestService);
    expect(service.method()).toBeInstanceOf(RequestService);
    expect(service.method() === service.requestService).toEqual(false); // because they are proxies
    // expect(service.method() === service.requestService).toEqual(true);
  });

  test('should handle this argument in closures', async function () {
    @Injectable({
      scope: Scope.REQUEST,
    })
    class RequestService {}

    let requestService: RequestService;

    @Injectable()
    class Service {
      constructor(
        readonly requestService: RequestService,
      ) {}

      method() {
        setTimeout(() => {
          requestService = this.requestService;
        }, 10);
      }
    }

    const injector = Injector.create([
      Service,
      RequestService,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.requestService).toBeInstanceOf(RequestService);
    service.method();

    await new Promise(resolve => {
      setTimeout(() => {
        resolve(undefined);
      }, 20);
    });
    expect(requestService === service.requestService).toEqual(false); // because they are proxies
    // expect(requestService === service.requestService).toEqual(true);
  });

  test('should handle this argument in deep closures', async function () {
    @Injectable({
      scope: Scope.REQUEST,
    })
    class RequestService {}

    let requestService: RequestService;

    @Injectable()
    class Service {
      constructor(
        readonly requestService: RequestService,
      ) {}

      method() {
        return () => {
          return {
            requestService: this.requestService,
          }
        }
      }
    }

    const injector = Injector.create([
      Service,
      RequestService,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.requestService).toBeInstanceOf(RequestService);
    const fn = service.method();
    expect(fn().requestService).toBeInstanceOf(RequestService);
    expect(fn().requestService === service.requestService).toEqual(false); // because they are proxies
    // expect(fn().requestService === service.requestService).toEqual(true);
  });

  test('should work with every provider which has in deps tree request scope', async function () {
    @Injectable({
      scope: Scope.REQUEST,
    })
    class RequestService {}

    @Injectable()
    class DeepService {
      constructor(
        readonly requestService: RequestService,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly deepService: DeepService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      DeepService,
      RequestService,
    ]);

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
    expect(service.deepService.requestService).toBeInstanceOf(RequestService);

    const deepService = injector.get(DeepService);
    expect(deepService).toBeInstanceOf(DeepService);
    expect(deepService.requestService).toBeInstanceOf(RequestService);

    expect(service.deepService === deepService).toEqual(false);
    expect(service.deepService.requestService === deepService.requestService).toEqual(false);
  });

  test('should work with multiple requested providers', async function () {
    @Injectable({
      scope: Scope.REQUEST,
    })
    class RequestService1 {}

    @Injectable({
      scope: Scope.REQUEST,
    })
    class RequestService2 {}

    @Injectable()
    class DeepService {
      public createdTimes: number = 0;

      constructor(
        readonly requestService1: RequestService1,
      ) {
        this.createdTimes++;
      }
    }

    @Injectable()
    class Service {
      public createdTimes: number = 0;

      constructor(
        readonly deepService: DeepService,
        readonly requestService1: RequestService1,
        readonly requestService2: RequestService2,
      ) {
        this.createdTimes++;
      }
    }

    const injector = Injector.create([
      Service,
      DeepService,
      RequestService1,
      RequestService2,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
    expect(service.requestService1).toBeInstanceOf(RequestService1);
    expect(service.requestService2).toBeInstanceOf(RequestService2);
    expect(service.deepService.requestService1).toBeInstanceOf(RequestService1);
    expect(service.requestService1 === service.deepService.requestService1).toEqual(false); // because they are proxies
    // expect(service.requestService1 === service.deepService.requestService1).toEqual(true); 
    expect(service.createdTimes).toEqual(1);
    expect(service.deepService.createdTimes).toEqual(1);

    const oldService1 = service;
    service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.requestService1).toBeInstanceOf(RequestService1);
    expect(service.requestService2).toBeInstanceOf(RequestService2);
    expect(service === oldService1).toEqual(false); // because they are proxies
    expect(service.createdTimes).toEqual(1);
    expect(service.deepService.createdTimes).toEqual(1);
    expect(service.requestService1 === oldService1.requestService1).toEqual(false);
    expect(service.requestService2 === oldService1.requestService2).toEqual(false);
    expect(service.deepService.requestService1 === oldService1.deepService.requestService1).toEqual(false);
    expect(service.requestService1 === service.deepService.requestService1).toEqual(false); // because they are proxies
    // expect(service.requestService1 === service.deepService.requestService1).toEqual(true);
  });

  test('should work with nested requested providers', async function () {
    @Injectable({
      scope: Scope.REQUEST,
    })
    class DeepRequestService {}

    @Injectable({
      scope: Scope.REQUEST,
    })
    class RequestService {
      constructor(
        readonly deepRequestService: DeepRequestService,
      ) {}
    }

    @Injectable()
    class Service {
      public createdTimes: number = 0;

      constructor(
        readonly requestService: RequestService,
      ) {
        this.createdTimes++;
      }
    }

    const injector = Injector.create([
      Service,
      RequestService,
      DeepRequestService,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.requestService).toBeInstanceOf(RequestService);
    expect(service.requestService.deepRequestService).toBeInstanceOf(DeepRequestService);
    expect(service.createdTimes).toEqual(1);
  });

  test('should pass requestData from session to the created context', async function () {
    @Injectable({
      scope: Scope.REQUEST,
    })
    class RequestService {
      constructor(
        readonly context: Context,
      ) {}
    }

    @Injectable()
    class Service {
      public createdTimes: number = 0;

      constructor(
        // two instances to check that every instance has this same request data
        readonly requestService1: RequestService,
        readonly requestService2: RequestService,
      ) {
        this.createdTimes++;
      }
    }

    const injector = Injector.create([
      Service,
      RequestService,
    ]);

    const session = Session.createStandalone(Service, injector);
    session.shared.requestData = { foo: 'bar' }
    let service = injector.get(Service, undefined, session);
    expect(service).toBeInstanceOf(Service);
    expect(service.requestService1).toBeInstanceOf(RequestService);
    expect(service.requestService1.context.get('foo')).toEqual('bar');
    expect(service.requestService2).toBeInstanceOf(RequestService);
    expect(service.requestService2.context.get('foo')).toEqual('bar');
    expect(service.requestService1 === service.requestService2).toEqual(false); // because they are proxies
    expect(service.requestService1.context.get() === service.requestService2.context.get()).toEqual(false); // because they are proxies
    expect(service.createdTimes).toEqual(1);

    // check that contexts share that same data
    service.requestService1.context.set('bar', 'foo')
    expect(service.requestService1.context.get('bar')).toEqual('foo');
    expect(service.requestService2.context.get('bar')).toEqual('foo');
  });

  // TODO: Support method injection
  test.skip('should work with method injection', async function () {
    @Injectable({
      scope: Scope.REQUEST,
    })
    class RequestService {}

    @Injectable()
    class Service {
      method(@Inject() requestService?: RequestService) {
        return requestService;
      }
    }

    const injector = Injector.create([
      Service,
      RequestService,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toBeInstanceOf(RequestService);
  });

  describe('onDestroy hook', function () {
    test('should remove on manual destruction', async function () {
      let destroyOrder: string[] = [];

      @Injectable({
        scope: Scope.REQUEST,
      })
      class RequestService {
        onDestroy() {
          destroyOrder.push('requestService');
        }
      }
  
      @Injectable()
      class Service {
        public createdTimes: number = 0;
  
        constructor(
          // two instances to check that every instance has this same request data
          readonly requestService1: RequestService,
          readonly requestService2: RequestService,
        ) {
          this.createdTimes++;
        }
      }
  
      const injector = Injector.create([
        Service,
        RequestService,
      ]);
  
      const session = Session.createStandalone(Service, injector);
      session.shared.requestData = { foo: 'bar' }
      let service = injector.get(Service, undefined, session);

      expect(service).toBeInstanceOf(Service);
      expect(service.requestService1).toBeInstanceOf(RequestService);
      expect(service.requestService1 === service.requestService2).toEqual(false); // because they are proxies
      
      expect(destroyOrder).toEqual([]);
      DestroyManager.destroyAll('manually', session.shared.proxies);
      expect(destroyOrder).toEqual(['requestService']);
      DestroyManager.destroyAll('manually', session.shared.proxies);
      expect(destroyOrder).toEqual(['requestService']);
    });
  })
});
