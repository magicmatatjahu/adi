import { Injector, Injectable, Inject, Ctx, Context, createWrapper } from "../src";
import { promiseLikify } from "../src/utils/promise-likify";

describe.skip('Misc testing', function() {
  test('should inject with new wrapper def', function () {
    const TestWrapper1 = createWrapper((_: never) => {
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
        @Inject(TestWrapper1(TestWrapper2())) service: TestService,
      ) {}
    }

    const injector = new Injector([
      TestService,
      Service,
    ]);

    const service = injector.get(Service) as any;
    console.log(service)
    // service.then(val => {
    //   console.log(val);
    // })
  });
});
