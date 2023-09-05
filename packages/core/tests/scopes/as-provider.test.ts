import { Injector, Injectable, Context, Scope, Session, DestroyContext, ProviderInstance, Inject, Scoped, SingletonScope } from "../../src";

describe('Scope as provider', function () {
  test('should work', function () {
    let called: string[] = []

    @Injectable()
    class ProviderScope extends Scope<any> {
      get name() {
        return 'provider-scope'
      }

      public override getContext(session: Session<any>, options: any) {
        called.push('getContext')
        return Context.create()
      }

      public override shouldDestroy(instance: ProviderInstance<any>, options: any, context: DestroyContext) {
        called.push('shouldDestroy')
        return false;
      }

      public override canBeOverrided(session: Session<any>, options: any): boolean {
        called.push('canBeOverrided')
        return false;
      }
    }

    @Injectable({
      scope: ProviderScope,
    })
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service1: TestService,
        readonly service2: TestService,
      ) {}
    }

    const injector = Injector.create([
      ProviderScope,
      Service,
      TestService,
    ])

    const service = injector.getSync(Service)
    expect(service.service1).toBeInstanceOf(TestService);
    expect(service.service2).toBeInstanceOf(TestService);
    expect(service.service1 === service.service2).toEqual(false);
    expect(called).toEqual(['getContext', 'getContext'])
  });

  test('should work with Scoped hook - override scope case', function () {
    let called: string[] = []

    @Injectable()
    class ProviderScope extends Scope<any> {
      get name() {
        return 'provider-scope'
      }

      public override getContext(session: Session<any>, options: any) {
        called.push('getContext')
        return Context.create()
      }

      public override shouldDestroy(instance: ProviderInstance<any>, options: any, context: DestroyContext) {
        called.push('shouldDestroy')
        return false;
      }

      public override canBeOverrided(session: Session<any>, options: any): boolean {
        called.push('canBeOverrided')
        return false;
      }
    }

    @Injectable({
      scope: ProviderScope,
    })
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Scoped(SingletonScope)) readonly service1: TestService,
        @Inject(Scoped(SingletonScope)) readonly service2: TestService,
      ) {}
    }

    const injector = Injector.create([
      ProviderScope,
      Service,
      TestService,
    ])

    const service = injector.getSync(Service)
    expect(service.service1).toBeInstanceOf(TestService);
    expect(service.service2).toBeInstanceOf(TestService);
    expect(service.service1 === service.service2).toEqual(false);
    expect(called).toEqual(['canBeOverrided', 'getContext', 'canBeOverrided', 'getContext'])
  });
});
