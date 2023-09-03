import { Injector, Injectable } from "@adi/core";

import { Provides } from "../../../src/decorators/provides";

describe('Without registry provider plugin', function () {
  test('should not work', function () {
    class TestService1 {
      constructor(
        readonly service: any,
      ) {}
    }
    class TestService2 {
      constructor(
        readonly service: any,
      ) {}
    }

    @Injectable()
    class RegistryProvider {
      @Provides({ provide: TestService1 })
      static factory1() {
        return new TestService1(this);
      }

      @Provides({ provide: TestService2 })
      factory2() {
        return new TestService2(this);
      }
    }

    @Injectable()
    class Service {
      constructor(
        public testService1: TestService1,
        public testService2: TestService2,
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        useRegistry: RegistryProvider,
      },
    ])

    expect(() => injector.get(TestService1)).toThrow();
    expect(() => injector.get(TestService2)).toThrow();
  });
});
