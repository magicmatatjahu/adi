import { Injector, Injectable, Component, Module, MODULE_INITIALIZERS, INJECTOR_SCOPE } from "../src";
import { ref } from "../src/utils";

describe('Module', function() {
  test('should be able to create injector from module', async function() {
    @Injectable()
    class Service {}

    @Module({
      providers: [
        Service,
      ]
    })
    class MainModule {}

    const injector = await new Injector(MainModule).compile();

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
  });

  test('should inject given providers in constructor', async function() {
    @Injectable()
    class Service {}

    let createdService: Service = undefined;

    @Module({
      providers: [
        Service,
      ]
    })
    class MainModule {
      constructor(
        readonly service: Service,
      ) {
        createdService = service;
      }
    }

    const _ = await new Injector(MainModule).compile();
    expect(createdService).toBeInstanceOf(Service);
  });

  test('should be able to create components', async function() {
    @Injectable()
    class Service {}

    @Component()
    class Controller {
      constructor(
        readonly service: Service,
      ) {}
    }

    @Module({
      components: [
        Controller,
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

    const injector = await new Injector(MainModule).compile();
    const component = injector.getComponent(Controller) as Controller;
    expect(component).toBeInstanceOf(Controller);
    expect(component.service).toBeInstanceOf(Service);
  });

  test('should be able to imports another modules', async function() {
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

    const injector = await new Injector(MainModule).compile();
    expect(injector).toBeInstanceOf(Injector);
  });

  // test('should call MODULE_INITIALIZERS on init', async function() {
  //   @Module({
  //     providers: [
  //       {
  //         provide: MODULE_INITIALIZERS,
  //         useValue: 1,
  //       },
  //       {
  //         provide: MODULE_INITIALIZERS,
  //         useValue: 2,
  //       }
  //     ],
  //   })
  //   class MainModule {}

  //   const injector = await new Injector(MainModule).compile();
  //   expect(injector).toBeInstanceOf(Injector);
  // });

  test('should resolve simple modules graph', async function() {
    @Module()
    class D {}

    @Module()
    class C {}

    @Module({ imports: [D] })
    class B {}

    @Module({ imports: [B, C] })
    class A {}

    const injector = await new Injector(A).compile();
    expect(injector).toBeInstanceOf(Injector);
  });

  test('should resolve simple modules graph with circular references between modules', async function() {
    @Module({ imports: [ref(() => B)] })
    class D {}

    @Module()
    class C {}

    @Module({ imports: [D] })
    class B {}

    @Module({ imports: [B, C] })
    class A {}

    const injector = await new Injector(A).compile();
    expect(injector).toBeInstanceOf(Injector);
  });

  test('should resolve complex modules graph', async function() {
    @Module({ imports: [ref(() => D)] })
    class F {}

    @Module()
    class E {}

    @Module({ imports: [{ module: E, id: 'E' }] })
    class D {}

    @Module({ imports: [F] })
    class C {}

    @Module({ imports: [E, { module: C, id: 'C' }] })
    class B {}

    @Module({ imports: [B, E, C, D] })
    class A {}

    const injector = await new Injector(A).compile();
    expect(injector).toBeInstanceOf(Injector);
  });

  test('should resolve simple modules graph with modules initialization in proper order', async function() {
    const order = [];

    @Module()
    class D {
      constructor() {
        order.push('D');
      }
    }

    @Module()
    class C {
      constructor() {
        order.push('C');
      }
    }

    @Module({ imports: [D] })
    class B {
      constructor() {
        order.push('B');
      }
    }

    @Module({ imports: [B, C] })
    class A {
      constructor() {
        order.push('A');
      }
    }

    await new Injector(A).compile();
    expect(order).toEqual(['A', 'B', 'C', 'D']);
  });

  test('should resolve simple modules graph with injection in constructors', async function() {
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
    class D {
      constructor(
        readonly service: ServiceD,
      ) {
        service.addToOrder()
      }
    }

    @Module()
    class C {}

    @Module({ imports: [D] })
    class B {}

    @Module({ 
      imports: [B, C],
      providers: [ServiceA],
    })
    class A {
      constructor(
        readonly service: ServiceA,
      ) {
        service.addToOrder()
      }
    }

    await new Injector(A).compile();
    expect(order).toEqual(['ServiceA', 'ServiceD']);
  });

  test('should services work with exports', async function() {
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
    class D {}

    @Module({
      providers: [ServiceC],
      exports: [ServiceC],
    })
    class C {}

    @Module({ imports: [D] })
    class B {
      constructor(
        readonly service: ServiceD,
      ) {
        service.addToOrder()
      }
    }

    @Module({ 
      imports: [B, C],
    })
    class A {
      constructor(
        readonly service: ServiceC,
      ) {
        service.addToOrder()
      }
    }

    await new Injector(A).compile();
    expect(order).toEqual(['ServiceC', 'ServiceD']);
  });

  test('should work exports in dynamic modules', async function() {
    let service: SharedService;

    @Injectable()
    class SharedService {}

    @Module({ 
      providers: [SharedService],
      exports: [SharedService],
    })
    class C {}

    @Module()
    class B {
      constructor(
        readonly sharedService: SharedService,
      ) {
        service = sharedService;
      }
    }

    @Module({
      imports: [
        {
          module: B,
          imports: [C],
        }
      ]
    })
    class A {}

    const injector = await new Injector(A).compile();
    expect(service).toBeInstanceOf(SharedService);
  });

  test('should share this same record across modules (looking in parent case)', async function() {
    let serviceB: SharedService;
    let serviceA: SharedService;

    @Injectable()
    class SharedService {}

    @Module()
    class B {
      constructor(
        readonly service: SharedService,
      ) {
        serviceB = service;
      }
    }

    @Module({ 
      imports: [B],
      providers: [SharedService],
    })
    class A {
      constructor(
        readonly service: SharedService,
      ) {
        serviceA = service;
      }
    }

    await new Injector(A).compile();
    expect(serviceA).toEqual(serviceB);
  });

  test('should share this same record across modules (using exports case)', async function() {
    let serviceB: SharedService;
    let serviceA: SharedService;

    @Injectable()
    class SharedService {}

    @Module({
      providers: [SharedService],
      exports: [SharedService],
    })
    class B {
      constructor(
        readonly service: SharedService,
      ) {
        serviceB = service;
      }
    }

    @Module({ 
      imports: [B],
    })
    class A {
      constructor(
        readonly service: SharedService,
      ) {
        serviceA = service;
      }
    }

    await new Injector(A).compile();
    expect(serviceA).toEqual(serviceB);
  });

  test('should exports providers of module when in exports array is defined given module', async function() {
    @Injectable()
    class ServiceC {}

    @Module({
      providers: [ServiceC],
      exports: [ServiceC],
    })
    class C {}

    @Module({
      imports: [C],
      exports: [C],
    })
    class B {}

    @Module({ 
      imports: [B],
    })
    class A {}

    const injector = await new Injector(A).compile();
    const serviceC = injector.get(ServiceC);
    expect(serviceC).toBeInstanceOf(ServiceC);
  });

  test('should exports providers of module when in exports array is defined given module (dynamic module case)', async function() {
    @Injectable()
    class ServiceC {}

    @Module()
    class C {}

    @Module({
      imports: [
        {
          module: C,
          providers: [ServiceC],
          exports: [ServiceC],
        }
      ],
      exports: [C],
    })
    class B {}

    @Module({ 
      imports: [B],
    })
    class A {}

    const injector = await new Injector(A).compile();
    const serviceC = injector.get(ServiceC);
    expect(serviceC).toBeInstanceOf(ServiceC);
  });

  test('should exports providers of dynamic module when in exports array is defined given module', async function() {
    @Injectable()
    class ServiceC {}

    @Module({
      providers: [ServiceC],
      exports: [ServiceC],
    })
    class C {}

    @Module({
      imports: [C],
      exports: [
        {
          module: C,
          providers: [ServiceC]
        }
      ],
    })
    class B {}

    @Module({ 
      imports: [B],
    })
    class A {}

    const injector = await new Injector(A).compile();
    const serviceC = injector.get(ServiceC);
    expect(serviceC).toBeInstanceOf(ServiceC);
  });

  test('should exports providers of module when in exports array is defined given module (dynamic module case)', async function() {
    @Injectable()
    class ServiceC {}

    @Module()
    class C {}

    @Module({
      imports: [
        {
          module: C,
          providers: [ServiceC],
          exports: [ServiceC],
        }
      ],
      exports: [
        {
          module: C,
          providers: [ServiceC]
        }
      ],
    })
    class B {}

    @Module({ 
      imports: [B],
    })
    class A {}

    const injector = await new Injector(A).compile();
    const serviceC = injector.get(ServiceC);
    expect(serviceC).toBeInstanceOf(ServiceC);
  });

  test('should exports providers of module when in exports array is defined given module (facade case)', async function() {
    @Injectable()
    class ServiceB {}

    @Module()
    class B {}

    @Module({
      imports: [
        {
          module: B,
          providers: [ServiceB],
          exports: [ServiceB],
        }
      ],
      exports: [B],
    })
    class C {}

    @Module({ 
      imports: [B, C],
    })
    class A {}

    const injector = await new Injector(A).compile();
    const serviceB = injector.get(ServiceB);
    expect(serviceB).toBeInstanceOf(ServiceB);
  });

  test('should add extra providers using facade module', async function() {
    @Injectable()
    class ServiceB {}

    @Injectable()
    class ServiceC {
      constructor(
        readonly serviceB: ServiceB,
      ) {}
    }

    @Module({
      providers: [ServiceB],
    })
    class B {}

    @Module({
      imports: [
        {
          module: B,
          providers: [ServiceC],
          exports: [ServiceC],
        }
      ],
    })
    class C {}

    @Module({ 
      imports: [B, C],
    })
    class A {}

    const injector = await new Injector(A).compile();
    const moduleC = injector.select(C);
    const serviceC = moduleC.get(ServiceC);
    expect(serviceC).toBeInstanceOf(ServiceC);
    expect(serviceC.serviceB).toBeInstanceOf(ServiceB);
  });

  test('should handle falsed imports', async function() {
    @Module({ 
      imports: [
        undefined,
        null,
      ],
    })
    class A {}

    await new Injector(A).compile();
  });

  test('should work with .select()', async function() {
    @Injectable()
    class ServiceB {}

    @Module({
      providers: [ServiceB],
    })
    class B {}

    @Module({ 
      imports: [B],
    })
    class A {}

    const injector = await new Injector(A).compile();
    const moduleB = injector.select(B);
    const service = moduleB.get(ServiceB) as ServiceB;
    expect(service).toBeInstanceOf(ServiceB);
  });

  test('should work with treeshakable providers with module scops (reference to module)', async function() {
    @Module()
    class A {}

    @Injectable({
      provideIn: A,
    })
    class Service {}

    const injector = await new Injector(A).compile();
    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
  });

  test('should work with treeshakable providers with custom modules scopes (single scope)', async function() {
    @Injectable({
      provideIn: 'FOOBAR',
    })
    class Service {}

    @Module({ 
      providers: [
        {
          provide: INJECTOR_SCOPE,
          useValue: 'FOOBAR',
        }
      ],
    })
    class A {}

    const injector = await new Injector(A).compile();
    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
  });

  test('should work with treeshakable providers with custom modules scopes (multiple scopes)', async function() {
    @Injectable({
      provideIn: 'BARFOO',
    })
    class Service {}

    @Module({ 
      providers: [
        {
          provide: INJECTOR_SCOPE,
          useValue: ['FOOBAR', 'BARFOO'],
        }
      ],
    })
    class A {}

    const injector = await new Injector(A).compile();
    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
  });
});
