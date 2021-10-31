import { Injector, Injectable, Scope } from "../../src";

describe('Default scope', function () {
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
    expect(service.requestService === service.deepService.requestService).toEqual(true);
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
    expect(service.requestService === service.deepService.requestService).toEqual(true);
    expect(oldService1.requestService === oldService1.deepService.requestService).toEqual(true);
    expect(service.requestService === oldService1.requestService).toEqual(false);
    expect(service.deepService.requestService === oldService1.deepService.requestService).toEqual(false);
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
    expect(service.method() === service.requestService).toEqual(true);
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
    expect(requestService === service.requestService).toEqual(true);
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
    expect(fn().requestService === service.requestService).toEqual(true);
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
    expect(service.requestService1 === service.deepService.requestService1).toEqual(true);
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
    expect(service.requestService1 === service.deepService.requestService1).toEqual(true);
  });
});
