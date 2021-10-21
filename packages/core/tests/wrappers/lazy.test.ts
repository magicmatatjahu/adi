import { Injector, Injectable, Inject, NewLazy } from "../../src";

describe('Lazy wrapper', function () {
  test('should create lazy injection - normal injection.get(...) invocation', function () {
    @Injectable()
    class TestService {}

    const injector = new Injector([
      TestService,
      {
        provide: TestService,
        useWrapper: NewLazy(),
      },
    ]);

    const service = injector.newGet(TestService) as () => TestService;
    expect(service).toBeInstanceOf(Function);
    expect(service()).toBeInstanceOf(TestService);
  });

  test('should postpone creation - proxy case', function () {
    @Injectable()
    class LazyService {
      @Inject()
      public prop: String;
    }

    @Injectable()
    class TestService {
      @Inject(NewLazy({ proxy: true }))
      public lazyService: LazyService;
    }

    const injector = new Injector([
      TestService,
      LazyService,
    ]);

    let err: Error, service: TestService;
    try {
      service = injector.newGet(TestService) as TestService;
    } catch(e) {
      err = e;
    }
    expect(err).toEqual(undefined);

    try {
      service.lazyService.prop;
    } catch(e) {
      err = e;
    }
    expect(err === undefined).toEqual(false);
  });

  test('should create proxy - proxy case', function () {
    @Injectable()
    class LazyService {
      @Inject()
      public prop: String;
    }

    @Injectable()
    class TestService {
      @Inject(NewLazy({ proxy: true }))
      public lazyService: LazyService;
    }

    const injector = new Injector([
      TestService,
      LazyService,
      {
        provide: String,
        useValue: "foobar",
      }
    ]);

    const service = injector.newGet(TestService) as TestService;
    expect(service.lazyService).toBeInstanceOf(LazyService);
    expect(service.lazyService.prop).toEqual('foobar');
  });
});