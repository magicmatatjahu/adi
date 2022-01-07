import { Injector, Injectable, UseInterceptors, Interceptor, NextInterceptor } from "../../src";
import { ExecutionContext } from "../../src/injector/execution-context";

describe('Interceptors', function() {
  test('should work', function() {
    @Injectable()
    class InterceptorService2 implements Interceptor {
      intercept(context: ExecutionContext, next: NextInterceptor<any>) {
        next();
        next();
      }
    }

    @Injectable()
    class InterceptorService1 implements Interceptor {
      intercept(context: ExecutionContext, next: Function) {
        next();
        return next();
      }
    }

    const standalone = new InterceptorService1();

    @Injectable()
    class Service {
      @UseInterceptors(InterceptorService2, InterceptorService1, new InterceptorService1(), { intercept: standalone.intercept.bind(standalone) })
      method() {
        return 'Hello World'
        // console.log('method');
      }
    }

    const injector = new Injector([Service, InterceptorService1, InterceptorService2]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    console.log(service.method())
    service.method();
    // for (let i = 0; i < 100000; i++) {
    //   service.method();
    // }
  });
});
