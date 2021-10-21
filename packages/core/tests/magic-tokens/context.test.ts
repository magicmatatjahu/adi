import { Injector, Injectable, Context, STATIC_CONTEXT, Inject, NewNew, NewToken } from "../../src";

describe('Context token', function() {
  test('Should works in simple case', function() {
    @Injectable()
    class TestService {
      constructor(
        readonly context1: Context,
        readonly context2: Context,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        readonly context: Context,
      ) {}
    }

    const injector = new Injector([
      TestService,
      Service,
    ]);

    const service = injector.newGet(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.context).toBeInstanceOf(Context);
    expect(service.context === STATIC_CONTEXT).toEqual(true);
    expect(service.service.context1).toBeInstanceOf(Context);
    expect(service.service.context1 === STATIC_CONTEXT).toEqual(true);
    expect(service.service.context1 === service.service.context2).toEqual(true);
  });

  test('Should works with scopes', function() {
    @Injectable()
    class TestService {
      constructor(
        readonly context1: Context,
        readonly context2: Context,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(NewNew()) readonly newService: TestService,
        readonly context: Context,
      ) {}
    }

    const injector = new Injector([
      TestService,
      Service,
    ]);

    const service = injector.newGet(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.newService).toBeInstanceOf(TestService);
    expect(service.service === service.newService).toEqual(false);
    expect(service.context).toBeInstanceOf(Context);
    expect(service.context === STATIC_CONTEXT).toEqual(true);
    expect(service.service.context1).toBeInstanceOf(Context);
    expect(service.service.context1 === STATIC_CONTEXT).toEqual(true);
    expect(service.service.context2 === STATIC_CONTEXT).toEqual(true);
    expect(service.newService.context1).toBeInstanceOf(Context);
    expect(service.newService.context1 === STATIC_CONTEXT).toEqual(false);
    expect(service.newService.context1 === service.newService.context2).toEqual(true);
  });

  test('Should point to instance context in factory injection', function() {
    const injector = new Injector([
      {
        provide: 'context',
        useFactory(context: Context) { return context },
        inject: [Context],
      },
      {
        provide: 'test',
        useFactory(context1: Context, context2: Context) { return [context1, context2] },
        inject: ['context', [NewToken('context'), NewNew()]],
      },
    ]);

    const context = injector.newGet('test') as Context;
    expect(context[0]).toBeInstanceOf(Context);
    expect(context[1]).toBeInstanceOf(Context);
    expect(context[0] === STATIC_CONTEXT).toEqual(true);
    expect(context[1] === STATIC_CONTEXT).toEqual(false);
  });

  test('Should point to instance context in method injection', function() {
    @Injectable()
    class Service {
      method(@Inject() ctx?: Context) {
        return ctx;
      }
    }

    const injector = new Injector([
      Service,
    ]);

    const service = injector.newGet(Service);
    expect(service).toBeInstanceOf(Service);
    const ctx = service.method();

    expect(ctx).toBeInstanceOf(Context);
    expect(ctx === STATIC_CONTEXT).toEqual(true);
  });
});