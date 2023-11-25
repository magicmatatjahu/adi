import { DynamicScope, Injectable, Injector, TransientScope, destroy } from "../../src";

describe('Dynamic scope', function () {
  test('should work in simple case', async function () {
    @Injectable({
      scope: DynamicScope,
    })
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ])

    const service = injector.getSync(Service)
    const proxy = await injector.resolve(service, { ctx: {} })
    expect(proxy.service).toBeInstanceOf(TestService);
  });

  test('should work with two levels dynamics services', async function () {
    @Injectable({
      scope: DynamicScope,
    })
    class DeepTestService {}

    @Injectable({
      scope: DynamicScope,
    })
    class TestService {
      constructor(
        readonly deepService: DeepTestService
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
      DeepTestService,
    ])

    const service = injector.getSync(Service)
    const proxy = await injector.resolve(service, { ctx: {} })
    expect(proxy.service).toBeInstanceOf(TestService);
    expect(proxy.service.deepService).toBeInstanceOf(DeepTestService);
  });

  test('should work with additional service between dynamic services', async function () {
    @Injectable({
      scope: DynamicScope,
    })
    class DeepTestService {}

    @Injectable({
      scope: TransientScope,
    })
    class TransientService2 {
      constructor(
        readonly deepService: DeepTestService
      ) {}
    }

    @Injectable({
      scope: TransientScope,
    })
    class TransientService1 {
      constructor(
        readonly transientService2: TransientService2
      ) {}
    }

    @Injectable({
      scope: DynamicScope,
    })
    class TestService {
      constructor(
        readonly transientService1: TransientService1
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
      TransientService1,
      TransientService2,
      DeepTestService,
    ])

    const service = injector.getSync(Service)
    const proxy = await injector.resolve(service, { ctx: {} })
    expect(proxy.service).toBeInstanceOf(TestService);
    expect(proxy.service.transientService1).toBeInstanceOf(TransientService1);
    expect(proxy.service.transientService1.transientService2).toBeInstanceOf(TransientService2);
    expect(proxy.service.transientService1.transientService2.deepService).toBeInstanceOf(DeepTestService);
  });

  test('should not preserve dynamic values between calls if service should be new', async function () {
    @Injectable({
      scope: DynamicScope,
    })
    class DeepTestService {
      public ref = {}
    }

    @Injectable({
      scope: TransientScope,
    })
    class TransientService2 {
      public ref = {}

      constructor(
        public deepService: DeepTestService
      ) {}
    }

    @Injectable({
      scope: TransientScope,
    })
    class TransientService1 {
      public ref = {}

      constructor(
        public transientService2: TransientService2
      ) {}
    }

    @Injectable({
      scope: DynamicScope,
    })
    class TestService {
      public ref = {}

      constructor(
        public transientService1: TransientService1
      ) {}
    }

    @Injectable()
    class Service {
      public ref = {}

      constructor(
        public service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
      TransientService1,
      TransientService2,
      DeepTestService,
    ])

    const service = injector.getSync(Service)
    const proxy1 = await injector.resolve(service, { ctx: {} })
    const proxy2 = await injector.resolve(service, { ctx: {} })

    expect(proxy1.service).toBeInstanceOf(TestService);
    expect(proxy1.service.transientService1).toBeInstanceOf(TransientService1);
    expect(proxy1.service.transientService1.transientService2).toBeInstanceOf(TransientService2);
    expect(proxy1.service.transientService1.transientService2.deepService).toBeInstanceOf(DeepTestService);
    expect(proxy2.service).toBeInstanceOf(TestService);
    expect(proxy2.service.transientService1).toBeInstanceOf(TransientService1);
    expect(proxy2.service.transientService1.transientService2).toBeInstanceOf(TransientService2);
    expect(proxy2.service.transientService1.transientService2.deepService).toBeInstanceOf(DeepTestService);

    expect(proxy1 === proxy2).toEqual(false); // proxies
    expect(proxy1.ref === proxy2.ref).toEqual(true);
    expect(proxy1.service === proxy2.service).toEqual(false);
    expect(proxy1.service.ref === proxy2.service.ref).toEqual(false);
    expect(proxy1.service.transientService1 === proxy2.service.transientService1).toEqual(false);
    expect(proxy1.service.transientService1.ref === proxy2.service.transientService1.ref).toEqual(false);
    expect(proxy1.service.transientService1.transientService2 === proxy2.service.transientService1.transientService2).toEqual(false);
    expect(proxy1.service.transientService1.transientService2.ref === proxy2.service.transientService1.transientService2.ref).toEqual(false);
    expect(proxy1.service.transientService1.transientService2.deepService === proxy2.service.transientService1.transientService2.deepService).toEqual(false);
    expect(proxy1.service.transientService1.transientService2.deepService.ref === proxy2.service.transientService1.transientService2.deepService.ref).toEqual(false);
  });

  test('should work with singletons between dynamic services', async function () {
    const services: any[] = [];
    const normalServices: any[] = [];

    @Injectable({
      scope: DynamicScope,
    })
    class DeepTestService {
      public ref = {}
    }

    @Injectable()
    class NormalService {
      public ref = {}

      constructor(
        public deepService: DeepTestService
      ) {
        // in constructor we still operate on original reference to service, not proxied, so array should containts only one element
        normalServices.push(this);
      }
    }

    @Injectable({
      scope: TransientScope,
    })
    class TransientService {
      public ref = {}

      constructor(
        public normalService: NormalService
      ) {}
    }

    @Injectable({
      scope: DynamicScope,
    })
    class TestService {
      public ref = {}

      constructor(
        public transientService: TransientService
      ) {}
    }

    @Injectable()
    class Service {
      public ref = {}

      constructor(
        public service: TestService,
      ) {
        // in constructor we still operate on original reference to service, not proxied, so array should containts only one element
        services.push(this);
      }
    }

    const injector = Injector.create([
      Service,
      TestService,
      TransientService,
      NormalService,
      DeepTestService,
    ])

    const service = injector.getSync(Service)
    const proxy1 = await injector.resolve(service, { ctx: {} })
    const proxy2 = await injector.resolve(service, { ctx: {} })

    expect(proxy1.service).toBeInstanceOf(TestService);
    expect(proxy1.service.transientService).toBeInstanceOf(TransientService);
    expect(proxy1.service.transientService.normalService).toBeInstanceOf(NormalService);
    expect(proxy1.service.transientService.normalService.deepService).toBeInstanceOf(DeepTestService);
    expect(proxy2.service).toBeInstanceOf(TestService);
    expect(proxy2.service.transientService).toBeInstanceOf(TransientService);
    expect(proxy2.service.transientService.normalService).toBeInstanceOf(NormalService);
    expect(proxy2.service.transientService.normalService.deepService).toBeInstanceOf(DeepTestService);

    expect(proxy1 === proxy2).toEqual(false); // proxies
    expect(proxy1.ref === proxy2.ref).toEqual(true);
    expect(proxy1.service === proxy2.service).toEqual(false);
    expect(proxy1.service.ref === proxy2.service.ref).toEqual(false);
    expect(proxy1.service.transientService === proxy2.service.transientService).toEqual(false);
    expect(proxy1.service.transientService.ref === proxy2.service.transientService.ref).toEqual(false);
    expect(proxy1.service.transientService.normalService === proxy2.service.transientService.normalService).toEqual(false);
    expect(proxy1.service.transientService.normalService.ref === proxy2.service.transientService.normalService.ref).toEqual(true);
    expect(proxy1.service.transientService.normalService.deepService === proxy2.service.transientService.normalService.deepService).toEqual(false);
    expect(proxy1.service.transientService.normalService.deepService.ref === proxy2.service.transientService.normalService.deepService.ref).toEqual(false);

    // create additional 5 dynamic context to check if singleton services preserve instances between calls
    await injector.resolve(service, { ctx: {} })
    await injector.resolve(service, { ctx: {} })
    await injector.resolve(service, { ctx: {} })
    await injector.resolve(service, { ctx: {} })
    await injector.resolve(service, { ctx: {} })

    expect(services.length).toEqual(1);
    expect(normalServices.length).toEqual(1);
  })

  test('should preserve instances using dynamic context reference', async function () {
    @Injectable({
      scope: DynamicScope,
    })
    class DeepTestService {
      public ref = {}
    }

    @Injectable({
      scope: DynamicScope,
    })
    class TestService {
      public ref = {}

      constructor(
        readonly deepService: DeepTestService
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
      DeepTestService,
    ])

    const service = injector.getSync(Service)
    const ctx = {}
    const proxy1 = await injector.resolve(service, { ctx })
    const proxy2 = await injector.resolve(service, { ctx })

    expect(proxy1.service).toBeInstanceOf(TestService);
    expect(proxy1.service.deepService).toBeInstanceOf(DeepTestService);
    expect(proxy2.service).toBeInstanceOf(TestService);
    expect(proxy2.service.deepService).toBeInstanceOf(DeepTestService);

    expect(proxy1.service.ref === proxy2.service.ref).toEqual(true);
    expect(proxy1.service.deepService.ref === proxy2.service.deepService.ref).toEqual(true);
  });

  test('should work with destroy - simple case', async function () {
    const calls: string[] = [];

    @Injectable({
      scope: DynamicScope,
    })
    class DeepTestService {
      onDestroy() {
        calls.push('DeepTestService')
      }
    }

    @Injectable({
      scope: DynamicScope,
    })
    class TestService {
      constructor(
        readonly deepService: DeepTestService
      ) {}

      onDestroy() {
        calls.push('TestService')
      }
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
      ) {}

      onDestroy() {
        calls.push('Service')
      }
    }

    const injector = Injector.create([
      Service,
      TestService,
      DeepTestService,
    ])

    const service = injector.getSync(Service)
    const proxy = await injector.resolve(service, { ctx: {} })
    await destroy(proxy)
    await destroy(proxy)
    await destroy(proxy)
    expect(calls).toEqual(['TestService', 'DeepTestService'])
  })


  test('should work with destroy - complex case with different scopes', async function () {
    const calls: string[] = [];

    @Injectable({
      scope: DynamicScope,
    })
    class DeepTestService {
      onDestroy() {
        calls.push('DeepTestService')
      }
    }

    @Injectable()
    class NormalService {
      constructor(
        public deepService: DeepTestService
      ) {}

      onDestroy() {
        calls.push('NormalService')
      }
    }

    @Injectable({
      scope: TransientScope,
    })
    class TransientService {
      constructor(
        public normalService: NormalService
      ) {}

      onDestroy() {
        calls.push('TransientService')
      }
    }

    @Injectable({
      scope: DynamicScope,
    })
    class TestService {
      constructor(
        public transientService: TransientService
      ) {}

      onDestroy() {
        calls.push('TestService')
      }
    }

    @Injectable()
    class Service {
      constructor(
        public service: TestService,
      ) {}

      onDestroy() {
        calls.push('Service')
      }
    }

    const injector = Injector.create([
      Service,
      TestService,
      TransientService,
      NormalService,
      DeepTestService,
    ])

    const service = injector.getSync(Service)
    const proxy = await injector.resolve(service, { ctx: {} })
    await destroy(proxy)
    await destroy(proxy)
    await destroy(proxy)
    expect(calls).toEqual(['TestService', 'TransientService', 'DeepTestService'])
  })
});
