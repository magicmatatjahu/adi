import { Injector, Injectable, Scope, Inject, Context, Session } from "@adi/core";
import { destroyAll } from "@adi/core/lib/injector/destroy-manager";

import { CommonScopes } from '../../src/scopes';

describe('Request scope', function () {
  test('should create new instance by each resolution', function () {
    @Injectable({
      scope: CommonScopes.RESOLUTION,
    })
    class ResolutionService {}

    @Injectable()
    class Service {
      public createdTimes: number = 0;

      constructor(
        readonly resolutionService: ResolutionService,
      ) {
        this.createdTimes++;
      }
    }

    const injector = Injector.create([
      Service,
      ResolutionService,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.resolutionService).toBeInstanceOf(ResolutionService);
    expect(service.createdTimes).toEqual(1);
      
    const oldService1 = service;
    service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.resolutionService).toBeInstanceOf(ResolutionService);
    expect(service === oldService1).toEqual(false); // because they are proxies
    expect(service.createdTimes).toEqual(1);
    expect(service.resolutionService === oldService1.resolutionService).toEqual(false);

    const oldService2 = service;
    service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.resolutionService).toBeInstanceOf(ResolutionService);
    expect(service === oldService1).toEqual(false); // because they are proxies
    expect(service === oldService2).toEqual(false); // because they are proxies
    expect(service.createdTimes).toEqual(1);
    expect(service.resolutionService === oldService1.resolutionService).toEqual(false);
    expect(service.resolutionService === oldService2.resolutionService).toEqual(false);
    expect(oldService1.resolutionService === oldService2.resolutionService).toEqual(false);
  });

  test('should create new instance by each resolution - deep case', function () {
    @Injectable({
      scope: CommonScopes.RESOLUTION,
    })
    class ResolutionService {}

    @Injectable()
    class DeepService {
      public createdTimes: number = 0;

      constructor(
        readonly resolutionService: ResolutionService,
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
      ResolutionService,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
    expect(service.deepService.createdTimes).toEqual(1);
    expect(service.deepService.resolutionService).toBeInstanceOf(ResolutionService);
    expect(service.createdTimes).toEqual(1);

    const oldService1 = service;
    service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
    expect(service.deepService.resolutionService).toBeInstanceOf(ResolutionService);
    expect(service === oldService1).toEqual(false); // because they are proxies
    expect(service.createdTimes).toEqual(1);
    expect(service.deepService === oldService1.deepService).toEqual(false); // because they are proxies
    expect(service.deepService.createdTimes).toEqual(1);
    expect(service.deepService.resolutionService === oldService1.deepService.resolutionService).toEqual(false);

    const oldService2 = service;
    service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
    expect(service.deepService.resolutionService).toBeInstanceOf(ResolutionService);
    expect(service === oldService2).toEqual(false); // because they are proxies
    expect(service.createdTimes).toEqual(1);
    expect(service.deepService === oldService2.deepService).toEqual(false); // because they are proxies
    expect(service.deepService.createdTimes).toEqual(1);
    expect(service.deepService.resolutionService === oldService1.deepService.resolutionService).toEqual(false);
    expect(service.deepService.resolutionService === oldService2.deepService.resolutionService).toEqual(false);
    expect(oldService1.deepService.resolutionService === oldService2.deepService.resolutionService).toEqual(false);
  });

  test('should share this same instance', function () {
    @Injectable({
      scope: CommonScopes.RESOLUTION,
    })
    class ResolutionService {}

    @Injectable()
    class DeepService {
      public createdTimes: number = 0;

      constructor(
        readonly resolutionService: ResolutionService,
      ) {
        this.createdTimes++;
      }
    }

    @Injectable()
    class Service {
      public createdTimes: number = 0;

      constructor(
        readonly deepService: DeepService,
        readonly resolutionService: ResolutionService,
      ) {
        this.createdTimes++;
      }
    }

    const injector = Injector.create([
      Service,
      DeepService,
      ResolutionService,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
    expect(service.resolutionService).toBeInstanceOf(ResolutionService);
    expect(service.deepService.createdTimes).toEqual(1);
    expect(service.deepService.resolutionService).toBeInstanceOf(ResolutionService);
    expect(service.resolutionService === service.deepService.resolutionService).toEqual(false); // because they are proxies
    // expect(service.resolutionService === service.deepService.resolutionService).toEqual(true);
    expect(service.createdTimes).toEqual(1);

    const oldService1 = service;
    service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
    expect(service.resolutionService).toBeInstanceOf(ResolutionService);
    expect(service.deepService.resolutionService).toBeInstanceOf(ResolutionService);
    expect(service === oldService1).toEqual(false); // because they are proxies
    expect(service.createdTimes).toEqual(1);
    expect(service.deepService === oldService1.deepService).toEqual(false); // because they are proxies
    expect(service.deepService.createdTimes).toEqual(1);
    expect(service.resolutionService === service.deepService.resolutionService).toEqual(false); // because they are proxies
    // expect(service.resolutionService === service.deepService.resolutionService).toEqual(true);
    expect(oldService1.resolutionService === oldService1.deepService.resolutionService).toEqual(false); // because they are proxies
    // expect(oldService1.resolutionService === oldService1.deepService.resolutionService).toEqual(true);
    expect(service.resolutionService === oldService1.resolutionService).toEqual(false);
    expect(service.deepService.resolutionService === oldService1.deepService.resolutionService).toEqual(false);
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
      scope: CommonScopes.RESOLUTION,
    })
    class ResolutionService {
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
        readonly resolutionService: ResolutionService,
        readonly normalService: NormalService,
      ) {}

      method() {
        return this.normalService;
      }
    }

    const injector = Injector.create([
      Service,
      NormalService,
      ResolutionService,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.resolutionService).toBeInstanceOf(ResolutionService);
    expect(service.normalService).toBeInstanceOf(NormalService);
    expect(service.method()).toBeInstanceOf(NormalService);
    expect(service.method() === service.normalService).toEqual(false); // because they are proxies
    // expect(service.method() === service.resolutionService).toEqual(true);
    expect(service.normalService.createdTimes).toEqual(1);
    expect(service.method().createdTimes).toEqual(1);
    expect(service.resolutionService.normalService).toBeInstanceOf(NormalService);
    expect(service.resolutionService.method()).toBeInstanceOf(NormalService);
    expect(service.resolutionService.method() === service.resolutionService.normalService).toEqual(false); // because they are proxies
    // expect(service.resolutionService.method() === service.resolutionService.normalService).toEqual(true);
    expect(service.resolutionService.normalService.createdTimes).toEqual(1);
    expect(service.resolutionService.method().createdTimes).toEqual(1);
  });

  test('should handle this argument', function () {
    @Injectable({
      scope: CommonScopes.RESOLUTION,
    })
    class ResolutionService {}

    @Injectable()
    class Service {
      constructor(
        readonly resolutionService: ResolutionService,
      ) {}

      method() {
        return this.resolutionService;
      }
    }

    const injector = Injector.create([
      Service,
      ResolutionService,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.resolutionService).toBeInstanceOf(ResolutionService);
    expect(service.method()).toBeInstanceOf(ResolutionService);
    expect(service.method() === service.resolutionService).toEqual(false); // because they are proxies
    // expect(service.method() === service.resolutionService).toEqual(true);
  });

  test('should handle this argument in closures', async function () {
    @Injectable({
      scope: CommonScopes.RESOLUTION,
    })
    class ResolutionService {}

    let resolutionService: ResolutionService;

    @Injectable()
    class Service {
      constructor(
        readonly resolutionService: ResolutionService,
      ) {}

      method() {
        setTimeout(() => {
          resolutionService = this.resolutionService;
        }, 10);
      }
    }

    const injector = Injector.create([
      Service,
      ResolutionService,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.resolutionService).toBeInstanceOf(ResolutionService);
    service.method();

    await new Promise(resolve => {
      setTimeout(() => {
        resolve(undefined);
      }, 20);
    });
    expect(resolutionService === service.resolutionService).toEqual(false); // because they are proxies
    // expect(resolutionService === service.resolutionService).toEqual(true);
  });

  test('should handle this argument in deep closures', async function () {
    @Injectable({
      scope: CommonScopes.RESOLUTION,
    })
    class ResolutionService {}

    let resolutionService: ResolutionService;

    @Injectable()
    class Service {
      constructor(
        readonly resolutionService: ResolutionService,
      ) {}

      method() {
        return () => {
          return {
            resolutionService: this.resolutionService,
          }
        }
      }
    }

    const injector = Injector.create([
      Service,
      ResolutionService,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.resolutionService).toBeInstanceOf(ResolutionService);
    const fn = service.method();
    expect(fn().resolutionService).toBeInstanceOf(ResolutionService);
    expect(fn().resolutionService === service.resolutionService).toEqual(false); // because they are proxies
    // expect(fn().resolutionService === service.resolutionService).toEqual(true);
  });

  test('should work with every provider which has in deps tree request scope', async function () {
    @Injectable({
      scope: CommonScopes.RESOLUTION,
    })
    class ResolutionService {}

    @Injectable()
    class DeepService {
      constructor(
        readonly resolutionService: ResolutionService,
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
      ResolutionService,
    ]);

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
    expect(service.deepService.resolutionService).toBeInstanceOf(ResolutionService);

    const deepService = injector.get(DeepService);
    expect(deepService).toBeInstanceOf(DeepService);
    expect(deepService.resolutionService).toBeInstanceOf(ResolutionService);

    expect(service.deepService === deepService).toEqual(false);
    expect(service.deepService.resolutionService === deepService.resolutionService).toEqual(false);
  });

  test('should work with multiple requested providers', async function () {
    @Injectable({
      scope: CommonScopes.RESOLUTION,
    })
    class RequestService1 {}

    @Injectable({
      scope: CommonScopes.RESOLUTION,
    })
    class RequestService2 {}

    @Injectable()
    class DeepService {
      public createdTimes: number = 0;

      constructor(
        readonly resolutionService1: RequestService1,
      ) {
        this.createdTimes++;
      }
    }

    @Injectable()
    class Service {
      public createdTimes: number = 0;

      constructor(
        readonly deepService: DeepService,
        readonly resolutionService1: RequestService1,
        readonly resolutionService2: RequestService2,
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
    expect(service.resolutionService1).toBeInstanceOf(RequestService1);
    expect(service.resolutionService2).toBeInstanceOf(RequestService2);
    expect(service.deepService.resolutionService1).toBeInstanceOf(RequestService1);
    expect(service.resolutionService1 === service.deepService.resolutionService1).toEqual(false); // because they are proxies
    // expect(service.resolutionService1 === service.deepService.resolutionService1).toEqual(true); 
    expect(service.createdTimes).toEqual(1);
    expect(service.deepService.createdTimes).toEqual(1);

    const oldService1 = service;
    service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.resolutionService1).toBeInstanceOf(RequestService1);
    expect(service.resolutionService2).toBeInstanceOf(RequestService2);
    expect(service === oldService1).toEqual(false); // because they are proxies
    expect(service.createdTimes).toEqual(1);
    expect(service.deepService.createdTimes).toEqual(1);
    expect(service.resolutionService1 === oldService1.resolutionService1).toEqual(false);
    expect(service.resolutionService2 === oldService1.resolutionService2).toEqual(false);
    expect(service.deepService.resolutionService1 === oldService1.deepService.resolutionService1).toEqual(false);
    expect(service.resolutionService1 === service.deepService.resolutionService1).toEqual(false); // because they are proxies
    // expect(service.resolutionService1 === service.deepService.resolutionService1).toEqual(true);
  });

  test('should work with nested requested providers', async function () {
    @Injectable({
      scope: CommonScopes.RESOLUTION,
    })
    class DeepRequestService {}

    @Injectable({
      scope: CommonScopes.RESOLUTION,
    })
    class ResolutionService {
      constructor(
        readonly deepRequestService: DeepRequestService,
      ) {}
    }

    @Injectable()
    class Service {
      public createdTimes: number = 0;

      constructor(
        readonly resolutionService: ResolutionService,
      ) {
        this.createdTimes++;
      }
    }

    const injector = Injector.create([
      Service,
      ResolutionService,
      DeepRequestService,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.resolutionService).toBeInstanceOf(ResolutionService);
    expect(service.resolutionService.deepRequestService).toBeInstanceOf(DeepRequestService);
    expect(service.createdTimes).toEqual(1);
  });

  test('should pass requestData from session to the created context', async function () {
    @Injectable({
      scope: CommonScopes.RESOLUTION,
    })
    class ResolutionService {
      constructor(
        readonly context: Context,
      ) {}
    }

    @Injectable()
    class Service {
      public createdTimes: number = 0;

      constructor(
        // two instances to check that every instance has this same request data
        readonly resolutionService1: ResolutionService,
        readonly resolutionService2: ResolutionService,
      ) {
        this.createdTimes++;
      }
    }

    const injector = Injector.create([
      Service,
      ResolutionService,
    ]);

    const session = Session.createStandalone(Service, injector);
    session.shared.requestData = { foo: 'bar' }
    let service = injector.get(Service, undefined, session);
    expect(service).toBeInstanceOf(Service);
    expect(service.resolutionService1).toBeInstanceOf(ResolutionService);
    expect(service.resolutionService1.context.get('foo')).toEqual('bar');
    expect(service.resolutionService2).toBeInstanceOf(ResolutionService);
    expect(service.resolutionService2.context.get('foo')).toEqual('bar');
    expect(service.resolutionService1 === service.resolutionService2).toEqual(false); // because they are proxies
    expect(service.resolutionService1.context.get() === service.resolutionService2.context.get()).toEqual(false); // because they are proxies
    expect(service.createdTimes).toEqual(1);

    // check that contexts share that same data
    service.resolutionService1.context.set('bar', 'foo')
    expect(service.resolutionService1.context.get('bar')).toEqual('foo');
    expect(service.resolutionService2.context.get('bar')).toEqual('foo');
  });

  // TODO: Support method injection
  test.skip('should work with method injection', async function () {
    @Injectable({
      scope: CommonScopes.RESOLUTION,
    })
    class ResolutionService {
      public prop = {};

      method(@Inject('foobar') foobar?: string) {
        return this;
      }
    }

    @Injectable()
    class Service {
      constructor(
        readonly resolutionService1: ResolutionService,
        readonly resolutionService2: ResolutionService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      ResolutionService,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    // console.log(service.resolutionService1 === service.resolutionService2);
    // console.log(service.resolutionService1.prop === service.resolutionService2.prop);
    // console.log(service.resolutionService1.prop);
    // console.log(service.resolutionService2.prop);
    console.log(service.resolutionService1.method() === service.resolutionService2.method());
    // expect(service.method()).toBeInstanceOf(ResolutionService);
  });

  // TODO: Support method injection
  test.skip('should work with method injection', async function () {
    @Injectable({
      scope: CommonScopes.RESOLUTION,
    })
    class ResolutionService {}

    @Injectable()
    class Service {
      method(@Inject() resolutionService?: ResolutionService) {
        return resolutionService;
      }
    }

    const injector = Injector.create([
      Service,
      ResolutionService,
    ]);

    let service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toBeInstanceOf(ResolutionService);
  });

  describe('onDestroy hook', function () {
    test('should remove on manual destruction', async function () {
      let destroyOrder: string[] = [];

      @Injectable({
        scope: CommonScopes.RESOLUTION,
      })
      class ResolutionService {
        onDestroy() {
          destroyOrder.push('resolutionService');
        }
      }
  
      @Injectable()
      class Service {
        public createdTimes: number = 0;
  
        constructor(
          // two instances to check that every instance has this same request data
          readonly resolutionService1: ResolutionService,
          readonly resolutionService2: ResolutionService,
        ) {
          this.createdTimes++;
        }
      }
  
      const injector = Injector.create([
        Service,
        ResolutionService,
      ]);
  
      const session = Session.createStandalone(Service, injector);
      session.shared.requestData = { foo: 'bar' }
      let service = injector.get(Service, undefined, session);

      expect(service).toBeInstanceOf(Service);
      expect(service.resolutionService1).toBeInstanceOf(ResolutionService);
      expect(service.resolutionService1 === service.resolutionService2).toEqual(false); // because they are proxies
      
      expect(destroyOrder).toEqual([]);
      destroyAll(session.shared.proxies, 'manually');
      expect(destroyOrder).toEqual(['resolutionService']);
      destroyAll(session.shared.proxies, 'manually');
      expect(destroyOrder).toEqual(['resolutionService']);
    });
  })
});
