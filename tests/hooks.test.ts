import { Injector, Injectable, OnInit } from "../src";

describe('Hooks', function() {
  describe('onInit', function() {
    test('should works', function() {
      let checkInit = false;
  
      @Injectable()
      class Service implements OnInit {
        onInit() {
          checkInit = true;
        }
      }
  
      const injector = new Injector([
        Service,
      ]);
  
      const service = injector.get(Service) as Service;
      expect(service).toBeInstanceOf(Service);
      expect(checkInit).toEqual(true);
    });

    test('should call onInit hook in provider only one time after resolution', function() {
      let onInitCalls = 0;

      @Injectable()
      class TestService implements OnInit {
        onInit() {
          onInitCalls++;
        }
      }
  
      @Injectable()
      class Service {
        constructor(
          readonly testService1: TestService,
          readonly testService2: TestService,
          readonly testService3: TestService,
        ) {}
      }
  
      const injector = new Injector([
        Service,
        TestService,
      ]);
  
      const service = injector.get(Service);
      expect(service).toBeInstanceOf(Service);
      expect(onInitCalls).toEqual(1);
    });
  });
});
