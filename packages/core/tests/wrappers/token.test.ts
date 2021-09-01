import { Injector, Injectable, Inject, Token } from "../../src";

describe('Token wrapper', function() {
  test('should override inferred token', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Token(TestService)) readonly service: string,
      ) {}
    }


    const injector = new Injector([
      TestService,
      Service,
    ]);

    const service = injector.get(Service) ;
    expect(service).toBeInstanceOf(Service);
    expect(service.service).toBeInstanceOf(TestService);
  });

  test('should override token passed in @Inject() decorator', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject('nonExisting', Token(TestService)) readonly service: any,
      ) {}
    }

    const injector = new Injector([
      TestService,
      Service,
    ]);

    const service = injector.get(Service) ;
    expect(service).toBeInstanceOf(Service);
    expect(service.service).toBeInstanceOf(TestService);
  });
});