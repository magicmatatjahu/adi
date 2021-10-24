import { Injector, Injectable, Inject, Ctx, Context } from "../../src";

// TODO: Fix treeskahable providers
describe('Ctx wrapper', function () {
  test('should inject given context', function () {
    const firstCtx = new Context();
    const secondCtx = new Context();

    @Injectable()
    class TestService {
      constructor(
        readonly ctx: Context,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(Ctx(firstCtx)) readonly service1: TestService,
        @Inject(Ctx(secondCtx)) readonly service2: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.get(Service);
    expect(service.service1).toBeInstanceOf(TestService);
    expect(service.service1.ctx).toEqual(firstCtx);
    expect(service.service2).toBeInstanceOf(TestService);
    expect(service.service2.ctx).toEqual(secondCtx);
  });
});
