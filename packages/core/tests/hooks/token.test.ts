import { Injector, Injectable, Inject, Token } from "../../src";

describe('Token injection hook', function() {
  test('should override inferred token', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Token(TestService)) readonly service: any,
      ) {}
    }

    const injector = Injector.create([
      TestService,
      Service,
    ])

    const service = injector.getSync(Service)
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

    const injector = Injector.create([
      TestService,
      Service,
    ])

    const service = injector.getSync(Service)
    expect(service).toBeInstanceOf(Service);
    expect(service.service).toBeInstanceOf(TestService);
  });

  test('should override token passed in .inject() function', function() {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {}

    const injector = Injector.create([
      TestService,
      Service,
    ])

    const service = injector.getSync(Service, Token(TestService));
    expect(service).toBeInstanceOf(TestService);
  });
});
