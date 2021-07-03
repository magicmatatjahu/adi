import { Injector, Injectable, Inject, Lazy } from "../../src";

describe('Lazy wrapper', function () {
  test('should create lazy injection - normal injection.get(...) invocation', function () {
    @Injectable()
    class TestService {}

    const injector = new Injector([
      TestService,
      {
        provide: TestService,
        useWrapper: Lazy(false),
      },
    ]);

    const service = injector.get(TestService) as () => TestService;
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
      @Inject(Lazy())
      public lazyService: LazyService;
    }

    const injector = new Injector([
      TestService,
      LazyService,
    ]);

    let err: Error;
    try {
      injector.get(TestService) as TestService;
    } catch(e) {
      err = e;
    }
    expect(err).toEqual(undefined);
  });

  test('should create proxy - proxy case', function () {
    @Injectable()
    class LazyService {
      @Inject()
      public prop: String;
    }

    @Injectable()
    class TestService {
      @Inject(Lazy())
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

    const service = injector.get(TestService) as TestService;
    expect(service.lazyService).toBeInstanceOf(LazyService);
    expect(service.lazyService.prop).toEqual('foobar');
  });
});