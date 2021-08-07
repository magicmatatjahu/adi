import { Injector, Injectable, Context, STATIC_CONTEXT, Inject } from "../src";

describe('Special tokens (providers)', function() {
  describe.only('Context token', function() {
    test('Should works in simple case', function() {
      @Injectable()
      class TestService {
        constructor(
          readonly context: Context,
          // test INSTANCE scope
          readonly addContext: Context,
        ) {}
      }
  
      @Injectable()
      class Service {
        constructor(
          readonly service: TestService,
          readonly context: Context,
        ) {}
      }
  
      const injector = new Injector([
        TestService,
        Service,
      ]);
  
      const service = injector.get(Service) as Service;
      expect(service).toBeInstanceOf(Service);
      expect(service.service).toBeInstanceOf(TestService);
      expect(service.context).toBeInstanceOf(Context);
      expect(service.context === STATIC_CONTEXT).toEqual(true);
      expect(service.service.context).toBeInstanceOf(Context);
      expect(service.service.context === STATIC_CONTEXT).toEqual(true);
      expect(service.service.addContext === service.service.context).toEqual(true);
    });

    test('Should point to instance context in method injection', function() {
      @Injectable()
      class Service {
        method(@Inject() ctx?: Context) {
          return ctx;
        }
      }
  
      const injector = new Injector([
        Service,
      ]);
  
      const service = injector.get(Service) as Service;
      expect(service).toBeInstanceOf(Service);
      const ctx = service.method();

      expect(ctx).toBeInstanceOf(Context);
      expect(ctx === STATIC_CONTEXT).toEqual(true);
    });
  });
});
