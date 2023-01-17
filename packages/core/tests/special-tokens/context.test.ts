import { Injector, Injectable, Context, STATIC_CONTEXT, Inject, New, Token } from "../../src";

describe('Context token', function() {
  test('should work in simple case', function() {
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

    const injector = Injector.create([
      TestService,
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.context).toBeInstanceOf(Context);
    expect(service.context === STATIC_CONTEXT).toEqual(true);
    expect(service.service.context1).toBeInstanceOf(Context);
    expect(service.service.context1 === STATIC_CONTEXT).toEqual(true);
    expect(service.service.context1 === service.service.context2).toEqual(true);
  });

  test('should work with scopes', function() {
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
        @Inject([New()]) readonly newService: TestService,
        readonly context: Context,
      ) {}
    }

    const injector = Injector.create([
      TestService,
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
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

  test('should point to instance context in factory injection', function() {
    const injector = Injector.create([
      {
        provide: 'context',
        useFactory(context: Context) { return context },
        inject: [Context],
      },
      {
        provide: 'test',
        useFactory(context1: Context, context2: Context) { return [context1, context2] },
        inject: ['context', [Token('context'), New()]],
      },
    ]).init() as Injector;

    const context = injector.get('test') as Context;
    expect(context[0]).toBeInstanceOf(Context);
    expect(context[1]).toBeInstanceOf(Context);
    expect(context[0] === STATIC_CONTEXT).toEqual(true);
    expect(context[1] === STATIC_CONTEXT).toEqual(false);
  });

  test('should point to instance context in method injection', function() {
    @Injectable()
    class Service {
      method(@Inject() ctx?: Context) {
        return ctx;
      }
    }

    const injector = Injector.create([
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    const ctx = service.method();

    expect(ctx).toBeInstanceOf(Context);
    expect(ctx === STATIC_CONTEXT).toEqual(true);
  });
});
