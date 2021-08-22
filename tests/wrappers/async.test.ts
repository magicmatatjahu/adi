import { Injector, Injectable, Inject, Async, Scope } from "../../src";

describe('Async wrapper', function () {
  test('should inject given context', async function () {
    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly syncService: TestService,
        @Inject(Async()) readonly asyncService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service);
    expect(service.syncService).toBeInstanceOf(TestService);
    expect(service.asyncService).toBeInstanceOf(Promise);
    expect(await service.asyncService).toBeInstanceOf(TestService);
  });
});
