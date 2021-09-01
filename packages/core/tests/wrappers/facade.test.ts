import { Injector, Inject, Injectable, Facade, Scope, Value } from "../../src";

describe('Facade wrapper', function () {
  test('should works', function () {
    const facadeProviders = [
      {
        provide: 'foobar',
        useValue: 'facade foobar',
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
        @Inject(Facade(facadeProviders)) readonly facadeService: TestService,
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

    const service = injector.get(Service) ;
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.facadeService).toBeInstanceOf(TestService);
    expect(service.service.foobar).toEqual('normal foobar');
    expect(service.facadeService.foobar).toEqual('facade foobar');
  });

  test('should works with another wrappers', function () {
    const facadeProviders = [
      {
        provide: 'foobar',
        useValue: {
          foo: {
            bar: 'facade foobar',
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
        @Inject(Facade(facadeProviders)) readonly facadeService: TestService,
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

    const service = injector.get(Service) ;
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.facadeService).toBeInstanceOf(TestService);
    expect(service.service.foobar).toEqual('normal foobar');
    expect(service.facadeService.foobar).toEqual('facade foobar');
  });

  test('should works with deep injections', function () {
    const facadeProviders = [
      {
        provide: 'foobar',
        useValue: 'facade foobar',
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
        @Inject(Facade({ providers: facadeProviders, deep: true })) readonly facadeService: TestService,
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

    const service = injector.get(Service) ;
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.facadeService).toBeInstanceOf(TestService);
    expect(service.deepService).toBeInstanceOf(DeepService);
    expect(service.service.foobar).toEqual('normal foobar');
    expect(service.service.deepService.foobar).toEqual('normal foobar');
    expect(service.facadeService.foobar).toEqual('facade foobar');
    expect(service.facadeService.deepService.foobar).toEqual('facade foobar');
    expect(service.deepService.foobar).toEqual('normal foobar');
  });

  test('should works with deep injections and one of deep dependency has Facade wrapper', function () {
    const facadeProviders = [
      {
        provide: 'foobar',
        useValue: 'facade foobar',
      }
    ];
    const deepFacadeProviders = [
      {
        provide: 'foobar',
        useValue: 'deep facade foobar',
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
        @Inject(Facade({ providers: deepFacadeProviders })) readonly veryDeepService: VeryDeepService,
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
        @Inject(Facade({ providers: facadeProviders, deep: true })) readonly facadeService: TestService,
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

    const service = injector.get(Service) ;
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.facadeService).toBeInstanceOf(TestService);
    expect(service.deepService).toBeInstanceOf(DeepService);
    expect(service.deepService.veryDeepService).toBeInstanceOf(VeryDeepService);
    expect(service.service.foobar).toEqual('normal foobar');
    expect(service.service.deepService.foobar).toEqual('normal foobar');
    expect(service.facadeService.foobar).toEqual('facade foobar');
    expect(service.facadeService.deepService.foobar).toEqual('facade foobar');
    expect(service.deepService.foobar).toEqual('normal foobar');
    expect(service.veryDeepService.foobar).toEqual('normal foobar');
    expect(service.deepService.veryDeepService.foobar).toEqual('deep facade foobar');
  });
});
