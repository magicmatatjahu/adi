import { Injector, Injectable, Inject, Ctx, Context, createWrapper, InjectionToken } from "../src";

describe.skip('Misc testing', function() {
  test('should inject with new wrapper def', function () {
    const TestWrapper = createWrapper((_: never) => {
      return (injector, session, next) => {
        const value = next(injector, session);
        console.log(value);
        return value;
      }
    });

    const TestWrapper2 = createWrapper((_: never) => {
      return (injector, session, next) => {
        const value = next(injector, session);
        console.log(value);
        return value;
      }
    });

    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(TestWrapper()) service: TestService,
      ) {}
    }

    const injector = new Injector([
      TestService,
      Service,
    ]);

    const service = injector.get(Service);
  });

  test('should inject with new wrapper def', function () {
    const TestWrapper = createWrapper((_: never) => {
      return (injector, session, next) => {
        const value = next(injector, session);
        console.log(value);
        return value;
      }
    });

    @Injectable({
      useWrapper: TestWrapper(),
    })
    class TestService {}

    const testToken = new InjectionToken({
      useWrapper: TestWrapper(),
      useValue: 'lol',
      provideIn: 'any',
    });

    const injector = new Injector([
      TestService,
    ]);

    const service = injector.get(testToken);
  });
});
