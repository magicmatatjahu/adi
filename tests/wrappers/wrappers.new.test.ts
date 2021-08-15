import { Context, Injectable, Injector, Session, NewCtx } from "../../src";
import { createWrapper, runWrappers, NewCacheable } from "../../src/utils/wrappers.new";

describe('New wrappers', function() {
  it('standalone', function() {
    let num: number = 0;
    const TestWrapper = createWrapper<undefined, false>(_ => {
      return function Test(injector, session, next) {
        const value = next(injector, session);
        num++;
        return value;
      }
    });

    const wrappers = NewCacheable(TestWrapper(TestWrapper(TestWrapper())));
    const session = new Session(undefined, undefined, undefined, undefined, { target: Object }, undefined);
    runWrappers(wrappers, null, session, () => '');
    runWrappers(wrappers, null, session, () => '');
    runWrappers(wrappers, null, session, () => '');
    runWrappers(wrappers, null, session, () => '');
    console.log(num)
  });

  it('injector test', function() {
    let num: number = 0;
    const TestWrapper = createWrapper<undefined, false>(_ => {
      return function Test(injector, session, next) {
        const value = next(injector, session);
        num++;
        return value;
      }
    });

    @Injectable()
    class Service {}

    const injector = new Injector([
      Service,
      {
        provide: Service,
        useWrapper: TestWrapper(TestWrapper(TestWrapper()))
      },
      {
        provide: Service,
        useWrapper: TestWrapper(TestWrapper(TestWrapper()))
      },
      {
        provide: Service,
        useWrapper: TestWrapper(TestWrapper(TestWrapper()))
      },
    ]);

    const ctx1 = new Context();
    const ctx2 = new Context();

    // const session = new Session(undefined, undefined, undefined, undefined, { target: Object }, undefined);
    // const wrappers = TestWrapper(TestWrapper(TestWrapper()));
    injector._get(Service)
    const srv1 = injector._get(Service, NewCtx(ctx1));
    const srv2 = injector._get(Service, NewCtx(ctx2));
    const srv3 = injector._get(Service, NewCtx(ctx2));
    console.log(num)
    console.log(srv1 === srv2)
    console.log(srv2 === srv3)

    // // const wrappers = NewCacheable(TestWrapper(TestWrapper(TestWrapper())));
    // const session = new Session(undefined, undefined, undefined, undefined, { target: Object }, undefined);
    // runWrappers(wrappers, null, session, () => '');
    // runWrappers(wrappers, null, session, () => '');
    // runWrappers(wrappers, null, session, () => '');
    // runWrappers(wrappers, null, session, () => '');
    // console.log(num)
  });
});