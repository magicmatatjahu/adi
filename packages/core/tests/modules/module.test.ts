import { Injector, Injectable, Module, OnDestroy, OnInit, when, Inject, Named } from "../../src";

describe('Module', function() {
  test('should be able to create injector from module and instances of the corresponding providers', async function() {
    @Injectable()
    class Service {}

    @Module({
      providers: [
        Service,
      ]
    })
    class MainModule {}

    const injector = Injector.create(MainModule).build();

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
  });

  test('should inject providers to the module instance', function() {
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

    Injector.create(MainModule).build();
    expect(createdService).toBeInstanceOf(Service);
  });

  test('should be able to create components', function() {
    @Injectable()
    class Service {}

    @Injectable()
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

    const injector = Injector.create(MainModule).build();
    const component = injector.getComponent(Controller);
    expect(component).toBeInstanceOf(Controller);
    expect(component.service).toBeInstanceOf(Service);
  });

  test('should be able to create module from plain ModuleMetadata type', function() {
    @Injectable()
    class Service {}

    @Injectable()
    class Controller {
      constructor(
        readonly service: Service,
      ) {}
    }

    const injector = Injector.create({
      components: [
        Controller,
      ],
      providers: [
        Service,
      ],
    }).build();

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    const component = injector.getComponent(Controller);
    expect(component).toBeInstanceOf(Controller);
    expect(component.service).toBeInstanceOf(Service);
  });

  test('should init', async function() {
    const onInit: string[] = []; 

    @Injectable()
    class Service implements OnInit {
      onInit() {
        onInit.push('Service');
      }
    }

    @Module({
      providers: [
        Service,
      ],
    })
    class MainModule implements OnInit {
      constructor(
        readonly service: Service,
      ) {}

      onInit() {
        onInit.push('MainModule');
      }
    }

    Injector.create(MainModule).build();
    expect(onInit).toEqual(['Service', 'MainModule']);
  });

  test('should init with imports in proper order', async function() {
    const onInit: string[] = [];

    @Injectable()
    class ChildService implements OnInit {
      onInit() {
        onInit.push('ChildService');
      }
    }

    @Module({
      providers: [
        ChildService,
      ],
    })
    class ChildModule implements OnInit {
      constructor(
        readonly service: ChildService,
      ) {}

      onInit() {
        onInit.push('ChildModule');
      }
    }

    @Injectable()
    class Service implements OnInit {
      onInit() {
        onInit.push('Service');
      }
    }

    @Module({
      imports: [
        ChildModule,
      ],
      providers: [
        Service,
      ],
    })
    class MainModule implements OnInit {
      constructor(
        readonly service: Service,
      ) {}

      onInit() {
        onInit.push('MainModule');
      }
    }

    Injector.create(MainModule).build();
    expect(onInit).toEqual(['ChildService', 'ChildModule', 'Service', 'MainModule']);
  });

  test('should destroy internal records and itself in proper order', async function() {
    const onDestroyOrder: string[] = []; 

    @Injectable()
    class Service1 implements OnDestroy {
      onDestroy() {
        onDestroyOrder.push('Service1');
      }
    }

    @Injectable()
    class Service2 implements OnDestroy {
      onDestroy() {
        onDestroyOrder.push('Service2');
      }
    }

    @Injectable()
    class Controller implements OnDestroy {
      constructor(
        readonly service: Service1,
      ) {}

      onDestroy() {
        onDestroyOrder.push('Controller');
      }
    }

    @Module({
      components: [
        Controller,
      ],
      providers: [
        Service1,
        Service2,
      ],
    })
    class MainModule implements OnDestroy {
      constructor(
        readonly service: Service1,
      ) {}

      onDestroy() {
        onDestroyOrder.push('MainModule');
      }
    }

    const injector = Injector.create(MainModule).build();
    // init components
    injector.getComponent(Controller);
    // init providers
    injector.get(Service2);

    // destriy module/injector
    await injector.destroy();
    expect(onDestroyOrder).toEqual(['Controller', 'MainModule', 'Service1', 'Service2']);
  });

  test('should destroy itself and imported modules in proper order', async function() {
    const onDestroyOrder: string[] = [];

    @Injectable()
    class ChildService implements OnDestroy {
      onDestroy() {
        onDestroyOrder.push('ChildService');
      }
    }

    @Injectable()
    class ChildController implements OnDestroy {
      constructor(
        readonly service: ChildService,
      ) {}

      onDestroy() {
        onDestroyOrder.push('ChildController');
      }
    }

    @Module({
      components: [
        ChildController,
      ],
      providers: [
        ChildService,
      ],
    })
    class ChildModule implements OnDestroy {
      constructor(
        readonly service: ChildService,
      ) {}

      onDestroy() {
        onDestroyOrder.push('ChildModule');
      }
    }

    @Injectable()
    class Service implements OnDestroy {
      onDestroy() {
        onDestroyOrder.push('Service');
      }
    }

    @Injectable()
    class Controller implements OnDestroy {
      constructor(
        readonly service: Service,
      ) {}

      onDestroy() {
        onDestroyOrder.push('Controller');
      }
    }

    @Module({
      imports: [
        ChildModule,
      ],
      components: [
        Controller,
      ],
      providers: [
        Service,
      ],
    })
    class MainModule implements OnDestroy {
      constructor(
        readonly service: Service,
      ) {}

      onDestroy() {
        onDestroyOrder.push('MainModule');
      }
    }

    const injector = Injector.create(MainModule).build();
    // init components
    injector.getComponent(Controller);
    // init providers
    injector.get(Service);

    const childInjector = injector.selectChild(ChildModule);
    // init components
    childInjector.getComponent(ChildController);
    // init providers
    childInjector.get(ChildService);

    // destriy module/injector
    await injector.destroy();
    expect(onDestroyOrder).toEqual([
      'Controller', 'MainModule', 'Service',
      'ChildController', 'ChildModule', 'ChildService',
    ]);
  });

  test('should resolve definition from imported records if definitions from current record in injector do not meet the requirements', function() {
    @Module({ 
      providers: [
        {
          provide: 'token',
          useValue: 'named provider',
          when: when.named('foobar'),
        },
        {
          provide: 'token',
          useValue: 'not named provider',
        }
      ],
      exports: [
        'token',
      ]
    })
    class ChildModule2 {}

    @Module({ 
      providers: [
        {
          provide: 'token',
          useValue: 'not named provider',
        },
        {
          provide: 'token',
          useValue: 'not named provider',
        }
      ],
      exports: [
        'token',
      ]
    })
    class ChildModule1 {}

    @Injectable()
    class Service {
      constructor(
        @Inject('token', Named('foobar')) public foobar: string,
      ) {}
    }

    @Module({ 
      imports: [
        ChildModule1,
        ChildModule2,
      ],
      providers: [
        Service,
        {
          provide: 'token',
          useValue: 'not named provider',
        }
      ]
    })
    class MainModule {}

    const injector = Injector.create(MainModule).build();
    const service = injector.get(Service);
    expect(service.foobar).toEqual('named provider');
  });
});
