import { Injector, Injectable, OnInit } from "../src";

describe('Hooks', function() {
  describe('onInit', function() {
    test('should call onInit hook in provider', function() {
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
  });
});
