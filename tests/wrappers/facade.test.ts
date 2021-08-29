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


  // TODO: implement this
  test.skip('should works with deep injections', function () {
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
});
