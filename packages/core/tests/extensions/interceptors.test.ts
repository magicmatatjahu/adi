import { Injector, Injectable, UseInterceptors, Interceptor, NextInterceptor } from "../../src";
import { ExecutionContext } from "../../src/injector/execution-context";

describe('Interceptors', function() {
  test('should work', function() {
    @Injectable()
    class InterceptorService2 implements Interceptor {
      intercept(context: ExecutionContext, next: NextInterceptor<any>) {
        return next();
      }
    }

    @Injectable()
    class InterceptorService1 implements Interceptor {
      intercept(context: ExecutionContext, next: Function) {
        console.log('foobar')
        return next();
      }
    }

    const standalone = new InterceptorService1();

    @Injectable()
    class Service {
      @UseInterceptors(InterceptorService2, InterceptorService1, new InterceptorService1(), { intercept: standalone.intercept.bind(standalone) },
      { 
        intercept(ctx, next, foobar) { console.log(foobar); return next() },
        inject: ['foobar'],
      })
      method() {
        return 'Hello World'
        // console.log('method');
      }
    }

    const injector = new Injector([
      Service,
      InterceptorService1,
      InterceptorService2,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    console.log(service.method())
    // for (let i = 0; i < 100000; i++) {
    //   service.method();
    // }
  });
});
