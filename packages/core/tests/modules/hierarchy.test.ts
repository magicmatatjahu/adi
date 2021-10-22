import { Injector, Injectable, Module, DynamicModule, createWrapper, ref } from "../../src";

describe('Module hierarchy', function() {
  test('should be able to imports another modules', function() {
    @Injectable()
    class Service {}

    @Module()
    class SharedModule {}

    @Module()
    class FeatureModule {}

    @Module({
      imports: [
        SharedModule,
        FeatureModule,
      ],
      providers: [
        Service,
      ],
    })
    class MainModule {
      constructor(
        readonly service: Service,
      ) {}
    }

    const injector = Injector.create(MainModule).build();
    expect(injector).toBeInstanceOf(Injector);
  });

  test('should resolve simple modules graph', function() {
    /*
     *  D
     *  |
     *  B C
     *   \|
     *    A
     */

    @Module()
    class ModuleD {}

    @Module()
    class ModuleC {}

    @Module({ imports: [ModuleD] })
    class ModuleB {}

    @Module({ imports: [ModuleB, ModuleC] })
    class ModuleA {}

    const injector = Injector.create(ModuleA).build();
    expect(injector).toBeInstanceOf(Injector);
  });

  test('should resolve simple modules graph with circular references between modules', function() {
    /*
     *  B
     *  |
     *  D
     *  |
     *  B C
     *   \|
     *    A
     */

    @Module({ imports: [ref(() => ModuleB)] })
    class ModuleD {}

    @Module()
    class ModuleC {}

    @Module({ imports: [ModuleD] })
    class ModuleB {}

    @Module({ imports: [ModuleB, ModuleC] })
    class ModuleA {}

    const injector = Injector.create(ModuleA).build();
    expect(injector).toBeInstanceOf(Injector);
  });

  test('should resolve complex modules graph (with modules initialization in proper order)', function() {
    /*    
     *   E(id E) 
     *     |
     *     D
     *     |  
     *     F
     *     |
     * E C(id C)     F  E(id E)
     *  \  |         |    |
     *     B     E   C    D
     *       \   |   |   /
     *        \  |   |  /
     *         \ |   | /
     *             A
     */

    const order: string[] = [];

    @Module({ imports: [ref(() => ModuleD)] })
    class ModuleF {
      constructor() {
        order.push("F");
      }
    }

    @Module()
    class ModuleE {
      constructor() {
        order.push("E");
      }
    }

    @Module({ imports: [{ module: ModuleE, id: 'E' }] })
    class ModuleD {
      constructor() {
        order.push("D");
      }
    }

    @Module({ imports: [ModuleF] })
    class ModuleC {
      constructor() {
        order.push("C");
      }
    }

    @Module({ imports: [ModuleE, { module: ModuleC, id: 'C' }] })
    class ModuleB {
      constructor() {
        order.push("B");
      }
    }

    @Module({ imports: [ModuleB, ModuleE, ModuleC, ModuleD] })
    class ModuleA {
      constructor() {
        order.push("A");
      }
    }

    const injector = Injector.create(ModuleA).build();
    expect(injector).toBeInstanceOf(Injector);
    expect(order).toEqual([
      'E', // E module with "E" id from D module
      'F', // from C module with "static" id
      'F', // from C module with "C" id
      'C', // C module with "C" id from B module
      'D', 'C', 'E', 'B', // root modules
      'A', // main module
    ]);
  });

  test('should resolve simple modules graph with injection in constructors', function() {
    /*
     *  D
     *  |
     *  B C
     *   \|
     *    A
     */

    const order = [];

    @Injectable()
    class ServiceA {
      addToOrder() {
        order.push('ServiceA');
      }
    }

    @Injectable()
    class ServiceD {
      addToOrder() {
        order.push('ServiceD');
      }
    }

    @Module({
      providers: [ServiceD],
    })
    class ModuleD {
      constructor(
        readonly service: ServiceD,
      ) {
        service.addToOrder()
      }
    }

    @Module()
    class ModuleC {}

    @Module({ imports: [ModuleD] })
    class ModuleB {}

    @Module({ 
      imports: [ModuleB, ModuleC],
      providers: [ServiceA],
    })
    class ModuleA {
      constructor(
        readonly service: ServiceA,
      ) {
        service.addToOrder()
      }
    }

    Injector.create(ModuleA).build();
    expect(order).toEqual(['ServiceD', 'ServiceA']);
  });

  test('should resolve simple modules graph with injection in constructors (using services from imports)', function() {
    /*
     *  D
     *  |
     *  B C
     *   \|
     *    A
     */

    const order = [];

    @Injectable()
    class ServiceC {
      addToOrder() {
        order.push('ServiceC');
      }
    }

    @Injectable()
    class ServiceD {
      addToOrder() {
        order.push('ServiceD');
      }
    }

    @Module({
      providers: [ServiceD],
      exports: [ServiceD],
    })
    class ModuleD {}

    @Module({
      providers: [ServiceC],
      exports: [ServiceC],
    })
    class ModuleC {}

    @Module({ imports: [ModuleD] })
    class ModuleB {
      constructor(
        readonly service: ServiceD,
      ) {
        service.addToOrder()
      }
    }

    @Module({ 
      imports: [ModuleB, ModuleC],
    })
    class ModuleA {
      constructor(
        readonly service: ServiceC,
      ) {
        service.addToOrder()
      }
    }

    Injector.create(ModuleA).build();
    expect(order).toEqual(['ServiceD', 'ServiceC']);
  });

  test('should resolve graph with dynamic modules', function() {
    /*
     *  D
     *  |
     *  B C
     *   \|
     *    A
     */

    let service: SharedService;

    @Injectable()
    class SharedService {}

    @Module({ 
      providers: [SharedService],
      exports: [SharedService],
    })
    class ModuleC {}

    @Module()
    class ModuleB {
      constructor(
        readonly sharedService: SharedService,
      ) {
        service = sharedService;
      }
    }

    @Module({
      imports: [
        {
          module: ModuleB,
          imports: [ModuleC],
        }
      ]
    })
    class ModuleA {}

    Injector.create(ModuleA).build();
    expect(service).toBeInstanceOf(SharedService);
  });

  test('should share this same record across modules (looking for missed provider in the parent injector)', function() {
    /*
     *  B
     *  |
     *  A
     */

    let serviceB: SharedService;
    let serviceA: SharedService;

    @Injectable()
    class SharedService {}

    @Module()
    class ModuleB {
      constructor(
        readonly service: SharedService,
      ) {
        serviceB = service;
      }
    }

    @Module({ 
      imports: [ModuleB],
      providers: [SharedService],
    })
    class ModuleA {
      constructor(
        readonly service: SharedService,
      ) {
        serviceA = service;
      }
    }

    Injector.create(ModuleA).build();
    expect(serviceA).toEqual(serviceB);
  });

  test('should share this same record across modules (export provider to the parent injector)', function() {
    /*
     *  B
     *  |
     *  A
     */

    let serviceB: SharedService;
    let serviceA: SharedService;

    @Injectable()
    class SharedService {}

    @Module({
      providers: [SharedService],
      exports: [SharedService],
    })
    class ModuleB {
      constructor(
        readonly service: SharedService,
      ) {
        serviceB = service;
      }
    }

    @Module({ 
      imports: [ModuleB],
    })
    class ModuleA {
      constructor(
        readonly service: SharedService,
      ) {
        serviceA = service;
      }
    }

    Injector.create(ModuleA).build();
    expect(serviceA).toEqual(serviceB);
  });

  test('should create new provider in the parent module (export provider to the parent injector but without defining it in the providers array) - type provider case', function() {
    /*
     *  B
     *  |
     *  A
     */

    let serviceB: SharedService;
    let serviceA: SharedService;

    @Injectable()
    class SharedService {}

    @Module({
      exports: [SharedService],
    })
    class ModuleB {
      constructor(
        readonly service: SharedService,
      ) {
        serviceB = service;
      }
    }

    @Module({ 
      imports: [ModuleB],
    })
    class ModuleA {
      constructor(
        readonly service: SharedService,
      ) {
        serviceA = service;
      }
    }

    Injector.create(ModuleA).build();
    expect(serviceA).toEqual(serviceB);
  });

  test('should create new provider in the parent module (export provider to the parent injector but without defining it in the providers array) - custom provider case', function() {
    /*
     *  B
     *  |
     *  A
     */

    let serviceB: SharedService;
    let serviceA: SharedService;

    @Injectable()
    class SharedService {}

    @Module({
      exports: [{
        provide: SharedService,
        useClass: SharedService,
      }],
    })
    class ModuleB {
      constructor(
        readonly service: SharedService,
      ) {
        serviceB = service;
      }
    }

    @Module({ 
      imports: [ModuleB],
    })
    class ModuleA {
      constructor(
        readonly service: SharedService,
      ) {
        serviceA = service;
      }
    }

    Injector.create(ModuleA).build();
    expect(serviceA).toEqual(serviceB);
  });

  test('should create new provider in the parent module (export provider to the parent injector but without defining it in the providers array) - wrapper case', function() {
    /*
     *  B
     *  |
     *  A
     */

    let calledTimes: number = 0;
    const TestWrapper = createWrapper(() => {
      return (session, next) => {
        const value = next(session);
        calledTimes++;
        return value;
      }
    });

    let serviceB: SharedService;
    let serviceA: SharedService;

    @Injectable()
    class SharedService {}

    @Module({
      providers: [
        SharedService,
      ],
      exports: [
        SharedService,
        {
          provide: SharedService,
          useWrapper: TestWrapper(),
        }
      ],
    })
    class ModuleB {
      constructor(
        readonly service: SharedService,
      ) {
        serviceB = service;
      }
    }

    @Module({ 
      imports: [ModuleB],
    })
    class ModuleA {
      constructor(
        readonly service: SharedService,
      ) {
        serviceA = service;
      }
    }

    Injector.create(ModuleA).build();
    expect(serviceA).toEqual(serviceB);
    expect(calledTimes).toEqual(1);
  });

  test('should exports providers of module when in exports array is defined given module', function() {
    /*
     *  C
     *  |
     *  B
     *  |
     *  A
     */

    @Injectable()
    class ServiceC {}

    @Module({
      providers: [ServiceC],
      exports: [ServiceC],
    })
    class ModuleC {}

    @Module({
      imports: [ModuleC],
      exports: [ModuleC],
    })
    class ModuleB {}

    @Module({ 
      imports: [ModuleB],
    })
    class ModuleA {}

    const injector = Injector.create(ModuleA).build();
    const serviceC = injector.get(ServiceC);
    expect(serviceC).toBeInstanceOf(ServiceC);
  });

  test('should exports providers of module when in exports array is defined given module (dynamic module case)', function() {
    /*
     *  C
     *  |
     *  B
     *  |
     *  A
     */

    @Injectable()
    class ServiceC {}

    @Module()
    class ModuleC {}

    @Module({
      imports: [
        {
          module: ModuleC,
          providers: [ServiceC],
          exports: [ServiceC],
        }
      ],
      exports: [ModuleC],
    })
    class ModuleB {}

    @Module({ 
      imports: [ModuleB],
    })
    class ModuleA {}

    const injector = Injector.create(ModuleA).build();
    const serviceC = injector.get(ServiceC);
    expect(serviceC).toBeInstanceOf(ServiceC);
  });

  test('should exports only specific providers to the parent (case with dynamic module in exports)', function() {
    /*
     *  C
     *  |
     *  B
     *  |
     *  A
     */

    @Injectable()
    class ServiceC {}

    @Injectable()
    class ServiceNotExported {}

    let serviceNotUsedFromB: ServiceNotExported;

    @Module({
      providers: [ServiceC, ServiceNotExported],
      exports: [ServiceC, ServiceNotExported],
    })
    class ModuleC {}

    @Module({
      imports: [ModuleC],
      exports: [
        {
          module: ModuleC,
          providers: [ServiceC]
        }
      ],
    })
    class ModuleB {
      constructor(
        public service: ServiceNotExported,
      ) {
        serviceNotUsedFromB = service;
      }
    }

    @Module({ 
      imports: [ModuleB],
    })
    class ModuleA {}

    const injector = Injector.create(ModuleA).build();
    const serviceC = injector.get(ServiceC);
    expect(serviceC).toBeInstanceOf(ServiceC);

    let err: Error
    try {
      injector.get(ServiceNotExported);
    } catch(e) {
      err = e;
    }
    expect(serviceNotUsedFromB).toBeInstanceOf(ServiceNotExported);
    expect(err === undefined).toEqual(false);
  });

  test('should exports only specific providers to the parent (case with dynamic module in imports and exports)', function() {
    /*
     *  C
     *  |
     *  B
     *  |
     *  A
     */

    @Injectable()
    class ServiceC {}

    @Injectable()
    class ServiceNotExported {}

    let serviceNotUsedFromB: ServiceNotExported;

    @Module()
    class ModuleC {}

    @Module({
      imports: [
        {
          module: ModuleC,
          providers: [ServiceC, ServiceNotExported],
          exports: [ServiceC, ServiceNotExported],
        }
      ],
      exports: [
        {
          module: ModuleC,
          providers: [ServiceC]
        }
      ],
    })
    class ModuleB {
      constructor(
        public service: ServiceNotExported,
      ) {
        serviceNotUsedFromB = service;
      }
    }

    @Module({ 
      imports: [ModuleB],
    })
    class ModuleA {}

    const injector = Injector.create(ModuleA).build();
    const serviceC = injector.get(ServiceC);
    expect(serviceC).toBeInstanceOf(ServiceC);

    let err: Error
    try {
      injector.get(ServiceNotExported);
    } catch(e) {
      err = e;
    }
    expect(serviceNotUsedFromB).toBeInstanceOf(ServiceNotExported);
    expect(err === undefined).toEqual(false);
  });

  test('should exports providers of module when in exports array is defined given module (module proxy case)', function() {
    /*
     *   B(proxy)
     *      |
     *  B   C
     *   \ /
     *    A
     */

    @Injectable()
    class ServiceB {}

    @Module()
    class ModuleB {}

    @Module({
      imports: [
        {
          module: ModuleB,
          providers: [ServiceB],
          exports: [ServiceB],
        }
      ],
      exports: [ModuleB],
    })
    class ModuleC {}

    @Module({ 
      imports: [ModuleB, ModuleC],
    })
    class ModuleA {}

    const injector = Injector.create(ModuleA).build();
    const serviceB = injector.get(ServiceB);
    expect(serviceB).toBeInstanceOf(ServiceB);
  });

  test('proxy module should point as parent to the base injector of proxy module', function() {
    /*
     *   B(proxy)
     *      |
     *  B   C
     *   \ /
     *    A
     */

    @Injectable()
    class ServiceB {}

    @Injectable()
    class ProxyService {
      // if proxy works as expected it should inject ServiceB from parent injector (base module of proxy module)
      constructor(
        readonly service: ServiceB,
      ) {}
    }

    @Module({
      providers: [
        ServiceB,
      ]
    })
    class ModuleB {}

    @Module({
      imports: [
        {
          module: ModuleB,
          providers: [ProxyService],
          exports: [ProxyService],
        }
      ],
      exports: [ModuleB],
    })
    class ModuleC {}

    @Module({ 
      imports: [ModuleB, ModuleC],
    })
    class ModuleA {}

    const injector = Injector.create(ModuleA).build();
    const proxyService = injector.get(ProxyService);
    expect(proxyService).toBeInstanceOf(ProxyService);
    expect(proxyService.service).toBeInstanceOf(ServiceB);

    // if proxy works as expected it shouldn't see ServiceB in the scope
    let err: Error
    try {
      injector.get(ServiceB);
    } catch(e) {
      err = e;
    }
    expect(err === undefined).toEqual(false);
  });

  test('should works with async dynamic modules', async function() {
    /*
     *  C
     *  |
     *  B
     *  |
     *  A
     */

    @Injectable()
    class ServiceC {}

    let serviceC: ServiceC;

    @Module()
    class ModuleC {
      static async forRoot(): Promise<DynamicModule> {
        return {
          module: ModuleC,
          providers: [ServiceC],
          exports: [ServiceC],
        }
      }
    }

    @Module({
      imports: [
        ModuleC.forRoot(),
      ],
      exports: [ModuleC],
    })
    class ModuleB {
      constructor(
        readonly service: ServiceC,
      ) {
        serviceC = service;
      }
    }

    @Module({ 
      imports: [ModuleB],
    })
    class ModuleA {}

    await Injector.create(ModuleA).buildAsync();
    expect(serviceC).toBeInstanceOf(ServiceC);
  });

  test('should handle falsy imports', function() {
    @Module({ 
      imports: [
        undefined,
        null,
      ],
    })
    class ModuleA {}

    Injector.create(ModuleA).build();
  });

  test('should handle falsy imports (async dynamic module case)', async function() {
    /*
     *  C
     *  |
     *  B
     *  |
     *  A
     */

    @Module()
    class ModuleC {
      static async forRoot(): Promise<DynamicModule> {
        return undefined
      }
    }

    @Module({
      imports: [
        ModuleC.forRoot(),
      ],
    })
    class ModuleB {}

    @Module({ 
      imports: [ModuleB],
    })
    class ModuleA {}

    await Injector.create(ModuleA).buildAsync();
  });

  test('should work with .selectChild()', function() {
    @Injectable()
    class ServiceB {}

    @Module({
      providers: [ServiceB],
    })
    class ModuleB {}

    @Module({ 
      imports: [ModuleB],
    })
    class ModuleA {}

    const injector = Injector.create(ModuleA).build();
    const moduleB = injector.selectChild(ModuleB);
    const service = moduleB.get(ServiceB);
    expect(service).toBeInstanceOf(ServiceB);
  });

  test('should work with .selectChild() - with custom id', function() {
    @Injectable()
    class ServiceB {}

    @Module({
      providers: [ServiceB],
    })
    class ModuleB {}

    @Module({ 
      imports: [
        ModuleB,
        {
          module: ModuleB,
          id: 'module B',
        }
      ],
    })
    class ModuleA {}

    const injector = Injector.create(ModuleA).build();
    const moduleB = injector.selectChild(ModuleB);
    const serviceB = moduleB.get(ServiceB);
    const moduleBWithId = injector.selectChild(ModuleB, 'module B');
    const serviceBWithId = moduleBWithId.get(ServiceB);
    expect(serviceB).toBeInstanceOf(ServiceB);
    expect(serviceBWithId).toBeInstanceOf(ServiceB);
    expect(serviceB === serviceBWithId).toEqual(false);
  });

  test('should work with .selectChild() - deep imports', function() {
    /*
     *  D
     *  |
     *  B C
     *   \|
     *    A
     */

    @Injectable()
    class Service {}

    @Module({
      providers: [
        Service,
      ]
    })
    class ModuleD {}

    @Module({ imports: [ModuleD] })
    class ModuleC {}

    @Module({ imports: [ModuleC] })
    class ModuleB {}

    @Module({ imports: [ModuleB] })
    class ModuleA {}

    const injector = Injector.create(ModuleA).build();
    const moduleD = injector.selectChild(ModuleB).selectChild(ModuleC).selectChild(ModuleD);
    const service = moduleD.get(Service);
    expect(service).toBeInstanceOf(Service);
  });
});
