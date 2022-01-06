import { Injector, Injectable, UseInterceptors, Interceptor, NextInterceptor } from "../../src";
import { ExecutionContext } from "../../src/injector/execution-context";

describe('Interceptors', function() {
  test('should work', function() {
    @Injectable()
    class InterceptorService2 implements Interceptor {
      intercept(context: ExecutionContext, next: NextInterceptor<any>) {
          
      }
    }

    @Injectable()
    class InterceptorService1 implements Interceptor {
      intercept(context: ExecutionContext, next: Function) {
        // console.log(context)
        next();
      }
    }

    @Injectable()
    class Service {
      @UseInterceptors(InterceptorService2, InterceptorService1)
      method() {
        // console.log('method');
      }
    }

    const injector = new Injector([Service, InterceptorService1, InterceptorService2]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    service.method();
  });
});
