import { createInjector, Injectable, Inject, Scope } from "@adi/core";
import { expect } from 'chai';

import { useClassFactory } from "../../utils/useClassFactory.util";

describe('useClassFactory - util', () => {
  const token = "token";

  @Injectable()
  class Service {
    getFoo() {
      return "foo";
    }

    getAsyncBar() {
      return "bar";
    }

    getRef() {
      return {};
    }
  }

  it('should works sync useClassFactory', async () => {
    @Injectable()
    class UseFactoryService {
      constructor(
        public readonly service: Service,
      ) {}

      useFactory() {
        return this.service.getFoo();
      }
    }

    const injector = createInjector([
      Service,
      UseFactoryService,
      useClassFactory({
        provide: token,
        useFactory: UseFactoryService,
      }),
    ]);
    
    const foo = injector.resolveSync(token);
    expect(foo).to.be.equal("foo");
  });

  it('should works async useClassFactory', async () => {
    @Injectable()
    class UseFactoryService {
      constructor(
        public readonly service: Service,
      ) {}

      async useFactory() {
        return this.service.getAsyncBar();
      }
    }

    const injector = createInjector([
      Service,
      UseFactoryService,
      useClassFactory({
        provide: token,
        useFactory: UseFactoryService,
      }),
    ]);
    
    const instance = await injector.resolve(token);
    expect(instance).to.be.equal("bar");
  });

  it('should works custom methodName', async () => {
    @Injectable()
    class UseFactoryService {
      constructor(
        public readonly service: Service,
      ) {}

      async customUseFactory() {
        return `${this.service.getFoo()}${this.service.getAsyncBar()}`;
      }
    }

    const injector = createInjector([
      Service,
      UseFactoryService,
      useClassFactory({
        provide: token,
        useFactory: UseFactoryService,
        methodName: "customUseFactory",
      }),
    ]);
    
    const instance = await injector.resolve(token);
    expect(instance).to.be.equal("foobar");
  });

  it('should works scope', async () => {
    const tokenWithoutScope = "tokenWithoutScope";
    const tokenWithScope = "tokenWithScope";

    @Injectable()
    class UseFactoryService {
      constructor(
        public readonly service: Service,
      ) {}

      async useFactory() {
        return this.service.getRef();
      }
    }

    const injector = createInjector([
      Service,
      UseFactoryService,
      useClassFactory({
        provide: tokenWithoutScope,
        useFactory: UseFactoryService,
      }),
      useClassFactory({
        provide: tokenWithScope,
        useFactory: UseFactoryService,
        scope: Scope.TRANSIENT,
      }),
    ]);

    const firstRef = await injector.resolve(tokenWithoutScope);
    const secondRef = await injector.resolve(tokenWithoutScope);
    expect(firstRef).to.be.equal(secondRef);
    
    const firstTransientRef = await injector.resolve(tokenWithScope);
    const secondTransientRef = await injector.resolve(tokenWithScope);
    expect(firstTransientRef).not.to.be.equal(secondTransientRef);
  });

  it('should works params', async () => {
    @Injectable()
    class UseFactoryService {
      constructor(
        public readonly service: Service,
      ) {}

      useFactory(params: any) {
        return params;
      }
    }

    const injector = createInjector([
      Service,
      UseFactoryService,
      useClassFactory({
        provide: token,
        useFactory: UseFactoryService,
        params: "foobar"
      }),
    ]);

    const foo = injector.resolveSync(token);
    expect(foo).to.be.equal("foobar");
  });

  it('should works method injection with params', async () => {
    const factoryToken = "factoryToken";

    @Injectable()
    class UseFactoryService {
      constructor(
        public readonly service: Service,
      ) {}

      useFactory(foo: string, @Inject(factoryToken) bar: string) {
        return `${foo}${bar}`;
      }
    }

    const injector = createInjector([
      Service,
      UseFactoryService,
      {
        provide: factoryToken,
        useFactory: () => "bar",
      },
      useClassFactory({
        provide: token,
        useFactory: UseFactoryService,
        params: "foo"
      }),
    ]);

    const foo = await injector.resolve(token);
    expect(foo).to.be.equal("foobar");
  });

  it('should works override', async () => {
    const tokenToOverride = "tokenToOverride";

    @Injectable()
    class UseFactoryService {
      constructor(
        public readonly service: Service,
      ) {}

      useFactory() {
        return this.service.getFoo();
      }
    }

    const injector = createInjector([
      Service,
      UseFactoryService,
      {
        provide: token,
        useValue: "useValue",
      },
      useClassFactory({
        provide: token,
        useFactory: UseFactoryService,
      }),
      useClassFactory({
        provide: tokenToOverride,
        useFactory: UseFactoryService,
      }),
      {
        provide: tokenToOverride,
        useValue: "useValue",
      },
    ]);

    const foo = injector.resolveSync(token);
    expect(foo).to.be.equal("foo");
    const useValue = injector.resolveSync(tokenToOverride);
    expect(useValue).to.be.equal("useValue");
  });
});
