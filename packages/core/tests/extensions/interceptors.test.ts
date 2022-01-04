import { Injector, Injectable, UseInterceptors } from "../../src";

describe('Interceptors', function() {
  test('should work', function() {
    @Injectable()
    class Service {
      @UseInterceptors()
      method() {

      }
    }

    const injector = new Injector([Service]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
  });
});
