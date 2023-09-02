import { Injector, Injectable, Module, OnDestroy, OnInit, when, Inject, Named } from "../../src";

describe('Module', function() {
  test('should be able to create injector from module and instances of the corresponding providers', function() {
    @Injectable()
    class Service {}

    @Module({
      providers: [
        Service,
      ]
    })
    class MainModule {}

    const injector = Injector.create(MainModule)

    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
  });

  test('should inject providers to the module instance', function() {
    @Injectable()
    class Service {}

    let createdService: Service | undefined = undefined;

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

    Injector.create(MainModule)
    expect(createdService).toBeInstanceOf(Service);
  });

  test('should be able to create service with dependencies', function() {
    @Injectable()
    class Service {}

    @Injectable()
    class Controller {
      constructor(
        readonly service: Service,
      ) {}
    }

    @Module({
      providers: [
        Controller,
        Service,
      ],
    })
    class MainModule {
      constructor(
        readonly service: Service,
      ) {}
    }

    const injector = Injector.create(MainModule)
    const component = injector.getSync(Controller);
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
      providers: [
        Controller,
        Service,
      ],
    })

    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);

    const component = injector.getSync(Controller);
    expect(component).toBeInstanceOf(Controller);
    expect(component.service).toBeInstanceOf(Service);
  });

  test('should init', function() {
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

    Injector.create(MainModule);
    expect(onInit).toEqual(['Service', 'MainModule']);
  });

  test('should init with imports in proper order', function() {
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

    Injector.create(MainModule)
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
      providers: [
        Controller,
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

    const injector = Injector.create(MainModule)
    injector.get(Controller);
    injector.get(Service2);

    // destroy module/injector
    await injector.destroy();
    expect(onDestroyOrder).toEqual(['MainModule', 'Controller', 'Service1', 'Service2']);
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
      providers: [
        ChildController,
        ChildService,
      ],
    })
    class ChildModule implements OnDestroy {
      constructor(
        readonly controller: ChildController,
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
      providers: [
        Controller,
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

    const injector = Injector.create(MainModule)
    injector.get(Controller);
    injector.get(Service);

    // destriy module/injector
    await injector.destroy();
    expect(onDestroyOrder).toEqual([
      'MainModule', 'Controller', 'Service',
      'ChildModule', 'ChildController', 'ChildService',
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

    const injector = Injector.create(MainModule)
    const service = injector.getSync(Service);
    expect(service.foobar).toEqual('named provider');
  });

  test('should resolve definition from imported records only when given definition is exported', function() {
    @Module({ 
      providers: [
        {
          provide: 'token',
          useValue: 'not exported definition 1',
          name: 'token-1'
        },
        {
          provide: 'token',
          name: 'token-2',
          useValue: 'exported definition',
        },
        {
          provide: 'token',
          useValue: 'not exported definition 2',
          name: 'token-3'
        }
      ],
      exports: [
        {
          export: 'token',
          names: ['token-2']
        },
      ]
    })
    class ChildModule1 {}

    @Injectable()
    class Service {
      constructor(
        @Inject('token') public foobar: string,
      ) {}
    }

    @Module({ 
      imports: [
        ChildModule1,
      ],
      providers: [
        Service,
      ]
    })
    class MainModule {}

    const injector = Injector.create(MainModule)
    const service = injector.getSync(Service);
    expect(service.foobar).toEqual('exported definition');
  });
});
