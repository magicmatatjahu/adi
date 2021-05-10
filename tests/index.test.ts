import { Injector, Injectable, Inject, Token, Ref, Optional, Skip, Self, SkipSelf, New, Lazy, Named, Multi, Decorate, Context } from "../src";
import { STATIC_CONTEXT } from "../src/constants";

describe.skip('test', function() {
  test('Lazy wrapper', function() {
    @Injectable()
    class LazyService {
      constructor() {}
      method() { return 'lazy foobar'; }
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(Lazy()) public token: LazyService,
      ) {}
    }

    const injector = new Injector([
      Service,
      LazyService,
    ]);

    const service = injector.get(Service) as Service;
    console.log(service.token.method());

    expect(true).toEqual(true);
  });

  test('Decorate wrapper', function() {
    @Injectable()
    class Service {
      constructor() {}

      method() {
        return "foo";
      }
    }

    class Decorator {
      constructor(readonly service: Service) {}

      method() { return this.service.method() + 'bar'; }
    }

    const injector = new Injector([
      Service,
      {
        provide: Service,
        useWrapper: Decorate(Decorator),
      }
    ]);

    const service = injector.get(Service) as Service;
    console.log(service.method());

    expect(true).toEqual(true);
  });
});
