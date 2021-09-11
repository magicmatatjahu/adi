import { Injector, Inject, Injectable, Portal, Scope, Value, Module } from "../../src";

describe('Portal wrapper', function () {
  test('should works', function () {
    const portalProviders = [
      {
        provide: 'foobar',
        useValue: 'portal foobar',
      }
    ];

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TestService {
      constructor(
        @Inject('foobar') readonly foobar: string,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(Portal(portalProviders)) readonly portalService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: 'foobar',
        useValue: 'normal foobar',
      }
    ]);

    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.portalService).toBeInstanceOf(TestService);
    expect(service.service.foobar).toEqual('normal foobar');
    expect(service.portalService.foobar).toEqual('portal foobar');
  });

  test('should works with another wrappers', function () {
    const portalProviders = [
      {
        provide: 'foobar',
        useValue: {
          foo: {
            bar: 'portal foobar',
          }
        }
      }
    ];

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TestService {
      constructor(
        @Inject('foobar', Value('foo.bar')) readonly foobar: string,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(Portal(portalProviders)) readonly portalService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: 'foobar',
        useValue: {
          foo: {
            bar: 'normal foobar',
          }
        },
      }
    ]);

    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.portalService).toBeInstanceOf(TestService);
    expect(service.service.foobar).toEqual('normal foobar');
    expect(service.portalService.foobar).toEqual('portal foobar');
  });

  test('should works with deep injections', function () {
    const portalProviders = [
      {
        provide: 'foobar',
        useValue: 'portal foobar',
      }
    ];

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class DeepService {
      constructor(
        @Inject('foobar') readonly foobar: string,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TestService {
      constructor(
        readonly deepService: DeepService,
        @Inject('foobar') readonly foobar: string,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(Portal({ providers: portalProviders, deep: true })) readonly portalService: TestService,
        readonly deepService: DeepService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      DeepService,
      {
        provide: 'foobar',
        useValue: 'normal foobar',
      }
    ]);

    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.portalService).toBeInstanceOf(TestService);
    expect(service.deepService).toBeInstanceOf(DeepService);
    expect(service.service.foobar).toEqual('normal foobar');
    expect(service.service.deepService.foobar).toEqual('normal foobar');
    expect(service.portalService.foobar).toEqual('portal foobar');
    expect(service.portalService.deepService.foobar).toEqual('portal foobar');
    expect(service.deepService.foobar).toEqual('normal foobar');
  });

  test('should works with deep injections and one of deep dependency has Portal wrapper', function () {
    const portalProviders = [
      {
        provide: 'foobar',
        useValue: 'portal foobar',
      }
    ];
    const deepFacadeProviders = [
      {
        provide: 'foobar',
        useValue: 'deep portal foobar',
      }
    ];

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class VeryDeepService {
      constructor(
        @Inject('foobar') readonly foobar: string,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class DeepService {
      constructor(
        @Inject(Portal({ providers: deepFacadeProviders })) readonly veryDeepService: VeryDeepService,
        @Inject('foobar') readonly foobar: string,
      ) {}
    }

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TestService {
      constructor(
        readonly deepService: DeepService,
        @Inject('foobar') readonly foobar: string,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(Portal({ providers: portalProviders, deep: true })) readonly portalService: TestService,
        readonly deepService: DeepService,
        readonly veryDeepService: VeryDeepService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      DeepService,
      VeryDeepService,
      {
        provide: 'foobar',
        useValue: 'normal foobar',
      }
    ]);

    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.portalService).toBeInstanceOf(TestService);
    expect(service.deepService).toBeInstanceOf(DeepService);
    expect(service.deepService.veryDeepService).toBeInstanceOf(VeryDeepService);
    expect(service.service.foobar).toEqual('normal foobar');
    expect(service.service.deepService.foobar).toEqual('normal foobar');
    expect(service.portalService.foobar).toEqual('portal foobar');
    expect(service.portalService.deepService.foobar).toEqual('portal foobar');
    expect(service.deepService.foobar).toEqual('normal foobar');
    expect(service.veryDeepService.foobar).toEqual('normal foobar');
    expect(service.deepService.veryDeepService.foobar).toEqual('deep portal foobar');
  });

  test('should works with imported provider', function () {
    const portalProviders = [
      {
        provide: 'foobar',
        useValue: 'portal foobar',
      }
    ];

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TestService {
      constructor(
        @Inject('foobar') readonly foobar: string,
        @Inject('local') readonly localFooBar: string,
      ) {}
    }

    @Module({
      providers: [
        TestService,
        {
          provide: 'foobar',
          useValue: 'normal foobar',
        },
        {
          provide: 'local',
          useValue: 'local ImportedModule foobar',
        }
      ],
      exports: [
        TestService,
      ]
    })
    class ImportedModule {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(Portal(portalProviders)) readonly portalService: TestService,
      ) {}
    }

    @Module({
      imports: [
        ImportedModule,
      ],
      providers: [
        Service
      ]
    })
    class MainModule {

    }

    const injector = Injector.create(MainModule).build();
    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.portalService).toBeInstanceOf(TestService);
    expect(service.service.foobar).toEqual('normal foobar');
    expect(service.service.localFooBar).toEqual('local ImportedModule foobar');
    expect(service.portalService.foobar).toEqual('portal foobar');
    expect(service.portalService.localFooBar).toEqual('local ImportedModule foobar');
  });
});
