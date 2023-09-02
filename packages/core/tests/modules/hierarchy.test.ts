import { Injector, Injectable, Module, ref, when, Inject, Optional } from "../../src";

import type { ExtendedModule } from '../../src';

describe('Module hierarchy', function() {
  test('should be able to imports another modules', function() {
    /*
     *  B C
     *   \|
     *    A
     */

    let _service: Service | undefined;
    const order: string[] = [];

    @Injectable()
    class Service {}

    @Module()
    class ModuleC {
      constructor() {
        order.push('ModuleC');
      }
    }

    @Module()
    class ModuleB {
      constructor() {
        order.push('ModuleB');
      }
    }

    @Module({
      imports: [
        ModuleB,
        ModuleC,
      ],
      providers: [
        Service,
      ],
    })
    class ModuleA {
      constructor(
        readonly service: Service,
      ) {
        order.push('ModuleA');
        _service = this.service;
      }
    }

    const injector = Injector.create(ModuleA)
    expect(injector).toBeInstanceOf(Injector);
    expect(_service).toBeInstanceOf(Service);
    expect(order).toEqual([
      'ModuleB',
      'ModuleC',
      'ModuleA',
    ]);
  });

  test('should resolve simple modules graph', function() {
    /*
    *  D
    *  |
    *  B C
    *   \|
    *    A
    */
    
    const order: string[] = [];

    @Module()
    class ModuleD {
      constructor() {
        order.push('ModuleD')
      }
    }

    @Module()
    class ModuleC {
      constructor() {
        order.push('ModuleC')
      }
    }

    @Module({ imports: [ModuleD] })
    class ModuleB {
      constructor() {
        order.push('ModuleB')
      }
    }

    @Module({ imports: [ModuleB, ModuleC] })
    class ModuleA {
      constructor() {
        order.push('ModuleA')
      }
    }

    const injector = Injector.create(ModuleA)
    expect(injector).toBeInstanceOf(Injector);
    expect(order).toEqual([
      'ModuleD',
      'ModuleB',
      'ModuleC',
      'ModuleA',
    ]);
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

    const order: string[] = [];

    @Module({ imports: [ref(() => ModuleB)] })
    class ModuleD {
      static lol = 'lol';
      constructor() {
        order.push('ModuleD')
      }
    }

    @Module()
    class ModuleC {
      constructor() {
        order.push('ModuleC')
      }
    }

    @Module({ imports: [ModuleD] })
    class ModuleB {
      constructor() {
        order.push('ModuleB')
      }
    }

    @Module({ imports: [ModuleB, ModuleC] })
    class ModuleA {
      constructor() {
        order.push('ModuleA')
      }
    }

    const injector = Injector.create(ModuleA)
    expect(injector).toBeInstanceOf(Injector);
    expect(order).toEqual([
      'ModuleD',
      'ModuleB',
      'ModuleC',
      'ModuleA',
    ]);
  });

  test('should resolve simple modules graph with injections in the constructors', function() {
    /*
     *  D
     *  |
     *  B C
     *   \|
     *    A
     */

    const order: string[] = [];

    @Injectable()
    class ServiceA {
      onInit() {
        order.push('ServiceA');
      }
    }

    @Injectable()
    class ServiceD {
      onInit() {
        order.push('ServiceD');
      }
    }

    @Module({
      providers: [ServiceD],
    })
    class ModuleD {
      constructor(
        readonly service: ServiceD,
      ) {}
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
      ) {}
    }

    Injector.create(ModuleA)
    expect(order).toEqual(['ServiceD', 'ServiceA']);
  });

  test('should resolve simple modules graph with injections in the constructors using services from imports', function() {
    /*
     *  D
     *  |
     *  B C
     *   \|
     *    A
     */

    const order: string[] = [];

    @Injectable()
    class ServiceC {
      onInit() {
        order.push('ServiceC');
      }
    }

    @Injectable()
    class ServiceD {
      onInit() {
        order.push('ServiceD');
      }
    }

    @Module({
      providers: [ServiceD],
      exports: [ServiceD],
    })
    class ModuleD {
      static test = 'test';
    }

    @Module({
      providers: [ServiceC],
      exports: [ServiceC],
    })
    class ModuleC {}

    @Module({ imports: [ModuleD] })
    class ModuleB {
      constructor(
        readonly service: ServiceD,
      ) {}
    }

    @Module({ 
      imports: [ModuleB, ModuleC],
    })
    class ModuleA {
      constructor(
        readonly service: ServiceC,
      ) {}
    }

    Injector.create(ModuleA)
    expect(order).toEqual(['ServiceD', 'ServiceC']);
  });

  test('should treat exported module as imported to the parent module', function() {
    /*
     *  B C
     *   \|
     *    A
     */

    let service: Service | undefined;

    @Injectable()
    class Service {}

    @Module({
      providers: [Service],
      exports: [Service],
    })
    class ModuleC {}

    @Module({ exports: [ModuleC] })
    class ModuleB {}

    @Module({ 
      imports: [ModuleB],
    })
    class ModuleA {
      constructor(
        readonly _service: Service,
      ) {
        service = _service
      }
    }

    const injector = Injector.create(ModuleA)
    expect(injector).toBeInstanceOf(Injector);
    expect(service).toBeInstanceOf(Service);
  });

  test('should resolve graph with extended module', function() {
    /*
     *  C
     *  |
     *  B
     *  |
     *  A
     */

    let service: SharedService | undefined;

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
          extends: ModuleB,
          imports: [ModuleC],
        } as any
      ]
    })
    class ModuleA {}

    Injector.create(ModuleA)
    expect(service).toBeInstanceOf(SharedService);
  });

  test('should share this same record across modules (looking for missed provider in the parent injector)', function() {
    /*
     *  B
     *  |
     *  A
     */

    let serviceB: SharedService | undefined;
    let serviceA: SharedService | undefined;

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

    Injector.create(ModuleA)
    expect(serviceA).toEqual(serviceB);
  });

  test('should share this same record across modules (export provider to the parent injector)', function() {
    /*
     *  B
     *  |
     *  A
     */

    let serviceB: SharedService | undefined;
    let serviceA: SharedService | undefined;

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

    Injector.create(ModuleA)
    expect(serviceA).toEqual(serviceB);
  });

  test('should share this same record across modules (looking for missed provider in the parent injector) - deep case with constraint', function() {
    /*
     *  C
     *  |
     *  B
     *  |
     *  A
     */

    let serviceC: SharedService | undefined;
    let serviceB: SharedService | undefined;
    let serviceA: SharedService | undefined;

    @Injectable()
    class SharedService {}

    @Module()
    class ModuleC {
      constructor(
        @Inject({ named: 'foobar' }) 
        readonly service: SharedService,
      ) {
        serviceC = service;
      }
    }

    @Module({
      imports: [ModuleC]
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
      providers: [
        SharedService,
        {
          provide: SharedService,
          useValue: 'foobar',
          when: when.named('foobar'),
        }
      ],
    })
    class ModuleA {
      constructor(
        readonly service: SharedService,
      ) {
        serviceA = service;
      }
    }

    Injector.create(ModuleA)
    expect(serviceA).toBeInstanceOf(SharedService);
    expect(serviceA).toEqual(serviceB);
    expect(serviceA === serviceC).toEqual(false);
    expect(serviceC).toEqual('foobar');
  });

  test('should create new provider in the parent module (export provider to the parent injector but without defining it in the providers array) - type provider case', function() {
    /*
     *  B
     *  |
     *  A
     */

    let serviceB: SharedService | undefined;
    let serviceA: SharedService | undefined;

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

    Injector.create(ModuleA)
    expect(serviceA).toEqual(serviceB);
  });

  test('should create new provider in the parent module (export provider to the parent injector but without defining it in the providers array) - custom provider case', function() {
    /*
     *  B
     *  |
     *  A
     */

    let serviceB: typeof SharedService | SharedService | undefined;
    let serviceA: typeof SharedService | SharedService | undefined;

    @Injectable()
    class SharedService {}

    @Module({
      exports: [{
        provide: SharedService,
        useValue: SharedService,
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

    Injector.create(ModuleA)
    expect(serviceA).toEqual(SharedService);
    expect(serviceB).toEqual(SharedService);
  });

  test('should export all providers of imported module', function() {
    /*
     *  C
     *  |
     *  B
     *  |
     *  A
     */

    let serviceC: ServiceC | undefined;

    @Injectable()
    class ServiceC {}

    @Module({
      providers: [ServiceC],
      exports: [ServiceC],
    })
    class ModuleC {}

    @Module({
      imports: [ModuleC],
      exports: [
        {
          from: ModuleC,
          export: '*'
        }
      ],
    })
    class ModuleB {}

    @Module({ 
      imports: [ModuleB],
    })
    class ModuleA {
      constructor(
        readonly service: ServiceC,
      ) {
        serviceC = service;
      }
    }

    Injector.create(ModuleA).init();
    expect(serviceC).toBeInstanceOf(ServiceC);
  });

  test('should export providers of module when in exports array is defined given module - extends module case', function() {
    /*
     *  C
     *  |
     *  B
     *  |
     *  A
     */

    let serviceC: ServiceC | undefined;

    @Injectable()
    class ServiceC {}

    @Module()
    class ModuleC {}

    @Module({
      imports: [
        {
          extends: ModuleC,
          providers: [ServiceC],
          exports: [ServiceC],
        }
      ],
      exports: [
        {
          from: ModuleC,
          export: '*'
        }
      ],
    })
    class ModuleB {}

    @Module({ 
      imports: [ModuleB],
    })
    class ModuleA {
      constructor(
        readonly service: ServiceC,
      ) {
        serviceC = service;
      }
    }

    Injector.create(ModuleA).init();
    expect(serviceC).toBeInstanceOf(ServiceC);
  });

  test('should export only specific providers from imported module to the parent', function() {
    /*
     *  C
     *  |
     *  B
     *  |
     *  A
     */
    
    let serviceNotUsedFromB: ServiceNotExported | undefined;
    
    @Injectable()
    class ServiceC {}

    @Injectable()
    class ServiceNotExported {}

    @Module({
      providers: [ServiceC, ServiceNotExported],
      exports: [ServiceC, ServiceNotExported],
    })
    class ModuleC {}

    @Module({
      imports: [ModuleC],
      exports: [
        {
          from: ModuleC,
          export: [ServiceC]
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

    const injector = Injector.create(ModuleA)
    const serviceC = injector.get(ServiceC);
    expect(serviceC).toBeInstanceOf(ServiceC);

    let err: unknown;
    try {
      injector.get(ServiceNotExported);
    } catch(e: unknown) {
      err = e;
    }
    expect(serviceNotUsedFromB).toBeInstanceOf(ServiceNotExported);
    expect(err === undefined).toEqual(false);
  });

  test('should export only specific providers from imported module to the parent - case with exported module', function() {
    /*
     *  C
     *  |
     *  B
     *  |
     *  A
     */

    let serviceNotUsedFromB: ServiceNotExported | undefined;

    @Injectable()
    class ServiceC {}

    @Injectable()
    class ServiceNotExported {}

    @Module()
    class ModuleC {}

    @Module({
      imports: [
        {
          extends: ModuleC,
          providers: [ServiceC, ServiceNotExported],
          exports: [ServiceC, ServiceNotExported],
        }
      ],
      exports: [
        {
          from: ModuleC,
          export: [ServiceC]
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

    const injector = Injector.create(ModuleA);
    const serviceC = injector.get(ServiceC);
    expect(serviceC).toBeInstanceOf(ServiceC);

    let err: unknown;
    try {
      injector.get(ServiceNotExported);
    } catch(e) {
      err = e;
    }
    expect(serviceNotUsedFromB).toBeInstanceOf(ServiceNotExported);
    expect(err === undefined).toEqual(false);
  });

  test('should work with async dynamic modules', async function() {
    /*
     *  C
     *  |
     *  B
     *  |
     *  A
     */

    let serviceC: ServiceC | undefined;

    @Injectable()
    class ServiceC {}

    @Module()
    class ModuleC {
      static async register(): Promise<ExtendedModule> {
        return {
          extends: ModuleC,
          providers: [ServiceC],
          exports: [ServiceC],
        }
      }
    }

    @Module({
      imports: [
        ModuleC.register(),
      ],
      exports: [
        {
          from: ModuleC,
          export: '*',
        }
      ],
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

    await Injector.create(ModuleA).init()
    expect(serviceC).toBeInstanceOf(ServiceC);
  });

  test('should work with deep extended module', async function() {
    /*
     *  C
     *  |
     *  B
     *  |
     *  A
     */

    let serviceC1: ServiceC1 | undefined;
    let serviceC2: ServiceC2 | undefined;

    @Injectable()
    class ServiceC1 {}

    @Injectable()
    class ServiceC2 {}

    @Module()
    class ModuleC {}

    @Module({
      imports: [
        {
          extends: {
            extends: {
              extends: ModuleC,
              providers: [ServiceC1],
            },
            providers: [ServiceC2],
            exports: [ServiceC2],
          },
          exports: [ServiceC1],
        }
      ],
      exports: [
        {
          from: ModuleC,
          export: '*'
        }
      ],
    })
    class ModuleB {
      constructor(
        readonly service1: ServiceC1,
        readonly service2: ServiceC2,
      ) {
        serviceC1 = service1;
        serviceC2 = service2;
      }
    }

    @Module({ 
      imports: [ModuleB],
    })
    class ModuleA {}

    Injector.create(ModuleA)
    expect(serviceC1).toBeInstanceOf(ServiceC1);
    expect(serviceC2).toBeInstanceOf(ServiceC2);
  });

  test('should handle falsy imports', function() {
    @Module({ 
      imports: [
        undefined as any,
        null,
      ],
    })
    class ModuleA {}

    Injector.create(ModuleA).init();
  });

  test('should handle falsy imports - case with async dynamic module', async function() {
    /*
     *  C
     *  |
     *  B
     *  |
     *  A
     */

    @Module()
    class ModuleC {
      static async forRoot(): Promise<ExtendedModule> {
        return undefined as any;
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

    await Injector.create(ModuleA).init();
  });

  test('should be able to define two these same modules in imports', function() {
    /*
     *  B
     *  |
     *  A
     */

    let service1: Service1 | undefined;
    let service2: Service2 | undefined;

    @Injectable()
    class Service1 {}

    @Injectable()
    class Service2 {}

    @Module()
    class ModuleB {
      static register1(): ExtendedModule {
        return {
          extends: ModuleB,
          providers: [
            Service1,
          ],
          exports: [
            Service1
          ]
        }
      }

      static register2(): ExtendedModule {
        return {
          extends: ModuleB,
          providers: [
            Service2,
          ],
          exports: [
            Service2
          ]
        }
      }
    }

    @Module({ 
      imports: [
        ModuleB.register1(),
        ModuleB.register2(),
      ],
    })
    class ModuleA {
      constructor(
        readonly _service1: Service1,
        readonly _service2: Service2,
      ) {
        service1 = _service1;
        service2 = _service2;
      }
    }

    Injector.create(ModuleA).init();
    expect(service1).toBeInstanceOf(Service1);
    expect(service2).toBeInstanceOf(Service2);
  });

  test('proxy modules should see providers from "original" module', function() {
    /*
     *  C
     *  |
     *  B C
     *   \|
     *    A
     */

    let fromC: string | undefined; 
    let fromB: string | undefined; 

    @Module({
      providers: [
        {
          provide: 'token',
          useValue: 'foobar',
        }
      ]
    })
    class ModuleC {}

    @Module({
      imports: [
        {
          extends: ModuleC,
          providers: [
            {
              provide: 'exported',
              useFactory(foobar: string) {
                return foobar;
              },
              inject: ['token'],
            }
          ],
          exports: [
            'exported',
          ]
        }
      ]
    })
    class ModuleB {
      constructor(
        @Inject('exported') readonly foobar: string,
        @Inject('token', Optional()) readonly token: string | undefined,
      ) {
        fromB = foobar;
        fromC = token;
      }
    }

    @Module({ 
      imports: [ModuleB, ModuleC] 
    })
    class ModuleA {}

    Injector.create(ModuleA)
    expect(fromB).toEqual('foobar');
    expect(fromC).toEqual(undefined);
  });

  // TODO
  test.skip('proxy modules should see providers from parent module', function() {
    /*
     *  C
     *  |
     *  B C
     *   \|
     *    A
     */

    let fromB: string | undefined; 
    let fromBItself: string | undefined; 

    @Module()
    class ModuleC {}

    @Module({
      imports: [
        {
          extends: ModuleC,
          providers: [
            {
              provide: 'exported',
              useFactory(foobar: string) {
                return foobar;
              },
              inject: ['token'],
            }
          ],
          exports: [
            'exported',
          ]
        }
      ],
      providers: [
        {
          provide: 'token',
          useValue: 'barfoo',
        }
      ]
    })
    class ModuleB {
      constructor(
        @Inject('token') readonly token: string,
        @Inject('exported') readonly foobar: string,
      ) {
        fromBItself = token;
        fromB = foobar;
      }
    }

    @Module({ 
      imports: [ModuleB, ModuleC] 
    })
    class ModuleA {}

    Injector.create(ModuleA).init();
    expect(fromBItself).toEqual('barfoo');
    // expect(fromB).toEqual('barfoo');
  });
});
