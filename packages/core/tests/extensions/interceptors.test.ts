import { Injector, Injectable, UseInterceptors, Interceptor } from "../../src";
import { ExecutionContext } from "../../src/injector/execution-context";

describe('Interceptors', function() {
  test('should work', function() {
    @Injectable()
    class InterceptorService implements Interceptor {
      intercept(context: ExecutionContext, next: Function) {
          
      }
    }

    @Injectable()
    class Service {
      @UseInterceptors(InterceptorService)
      method() {

      }
    }

    const injector = new Injector([Service, InterceptorService]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
  });
});
