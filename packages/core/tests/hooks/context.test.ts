import { Injector, Injectable, Inject, Ctx, Context } from "../../src";

describe('Ctx injection hook', function () {
  test('should inject given context', function () {
    const firstCtx = Context.create();
    const secondCtx = Context.create();

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

    const injector = Injector.create([
      Service,
      TestService,
    ])

    const service = injector.getSync(Service)
    expect(service.service1).toBeInstanceOf(TestService);
    expect(service.service1.ctx).toEqual(firstCtx);
    expect(service.service2).toBeInstanceOf(TestService);
    expect(service.service2.ctx).toEqual(secondCtx);
  });
});
