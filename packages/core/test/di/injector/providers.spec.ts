import { createInjector } from "../../../src/di/injector";
import { Injectable, Inject } from "../../../src/di/decorators";
import { Context, InjectionToken } from "../../../src/di/tokens";
import { expect } from 'chai';

describe('Providers', () => {
  it('TypeProvider', async () => {
    @Injectable()
    class Service {}

    const injector = createInjector([Service]);
    
    const service = await injector.resolve(Service);
    expect(service).not.to.be.undefined;
    expect(service instanceof Service).to.be.true;
  });

  it('TypeProvider with different than @Injectable() class decorator', async () => {
    function Decorator() {
      return function (_: Object) {}
    }

    @Decorator()
    class Service {}

    const injector = createInjector([Service]);
    
    const service = await injector.resolve(Service);
    expect(service).not.to.be.undefined;
    expect(service instanceof Service).to.be.true;
  });

  it('TypeProvider without decorator and without constructor parameters', async () => {
    class Service {
      constructor(
        public value: string,
      ) {}

      someMethod() {
        return "foobar";
      }
    }

    const injector = createInjector([Service]);
    
    const service = await injector.resolve(Service);
    expect(service).not.to.be.undefined;
    expect(service instanceof Service).to.be.true;
    expect(service.value).to.be.undefined;
    expect(service.someMethod()).to.be.equal("foobar");
  });

  it('ClassProvider', async () => {
    @Injectable()
    class ServiceA {}
  
    @Injectable()
    class ServiceB {}

    @Injectable()
    class ServiceC {
      @Inject()
      public readonly service: ServiceA;
    }

    const injector = createInjector([ServiceA, {
      provide: ServiceB,
      useClass: ServiceC,
    }]);
    
    const instance = await injector.resolve(ServiceB) as ServiceC;
    expect(instance).not.to.be.undefined;
    expect(instance instanceof ServiceC).to.be.true;
    expect(instance.service instanceof ServiceA).to.be.true;
  });

  it('ConstructorProvider', async () => {
    @Injectable()
    class ServiceA {}

    @Injectable()
    class ServiceB {}
  
    class ServiceC {
      @Inject()
      public readonly serviceB: ServiceB;

      constructor(
        public readonly serviceA: ServiceA,
      ) {}
    }

    const injector = createInjector([ServiceA, ServiceB, {
      provide: ServiceC,
      inject: [ServiceB],
    }]);
    
    const instance = await injector.resolve(ServiceC);
    expect(instance).not.to.be.undefined;
    expect(instance instanceof ServiceC).to.be.true;
    expect(instance.serviceA instanceof ServiceB).to.be.true;
    expect(instance.serviceB instanceof ServiceB).to.be.true;
  });

  it('StaticClassProvider', async () => {
    @Injectable()
    class ServiceA {}

    @Injectable()
    class ServiceB {}

    @Injectable()
    class ServiceC {}
  
    class ServiceD {
      @Inject()
      public readonly serviceB: ServiceB;

      constructor(
        public readonly serviceA: ServiceA,
        public readonly serviceBCtor: ServiceB,
      ) {}
    }

    const injector = createInjector([ServiceA, ServiceB, {
      provide: ServiceC,
      useClass: ServiceD,
      inject: [ServiceB, [Inject(ServiceA)]],
    }]);
    
    const instance = await injector.resolve(ServiceC) as ServiceD;
    expect(instance).not.to.be.undefined;
    expect(instance instanceof ServiceD).to.be.true;
    expect(instance.serviceA instanceof ServiceB).to.be.true;
    expect(instance.serviceB instanceof ServiceB).to.be.true;
    expect(instance.serviceBCtor instanceof ServiceA).to.be.true;
  });

  it('FactoryProvider', async () => {
    const token = "token";

    @Injectable()
    class Service {
      getFoo() {
        return "bar";
      }
    }

    const injector = createInjector([Service, {
      provide: token,
      useFactory: (service: Service) => service.getFoo(),
      inject: [Service],
    }]);
    
    const instance = await injector.resolve(token);
    expect(instance).to.be.equal("bar");
  });

  it('async FactoryProvider', async () => {
    const token = "token";

    @Injectable()
    class Service {
      getFoo() {
        return "bar";
      }
    }

    const injector = createInjector([Service, {
      provide: token,
      useFactory: async (service: Service) => service.getFoo(),
      inject: [Service],
    }]);
    
    const instance = await injector.resolve(token);
    expect(instance).to.be.equal("bar");
  });

  it('FactoryConfigProvider', async () => {
    const token = "token";

    @Injectable()
    class Service {
      config() {
        return "ConfigValue";
      }
    }

    class FactoryService {
      @Injectable(token)
      static getFoo(service: Service): string {
        return service.config();
      }
    }

    const injector = createInjector([
      {
        useFactory: FactoryService,
      },
      Service
    ]);
    
    const instance = await injector.resolve(token);
    expect(instance).to.be.equal("ConfigValue");
  });

  it('FactoryConfigProvider with override', async () => {
    const token = "token";

    class FactoryService {
      @Injectable(token)
      static getFoo(@Inject("config") config: string): string {
        return config;
      }
    }

    const injector = createInjector([
      {
        useFactory: FactoryService,
      },
      {
        provide: token,
        useValue: "OverrideValue",
      }
    ]);
    
    const instance = await injector.resolve(token);
    expect(instance).to.be.equal("OverrideValue");
  });

  it('ValueProvider', async () => {
    const token = "token";

    const injector = createInjector([{
      provide: token,
      useValue: "foo",
    }]);
    
    const instance = await injector.resolve(token);
    expect(instance).to.be.equal("foo");
  });

  it('ValueProvider - context', async () => {
    const token = "token";
    const ctx = new Context();

    const injector = createInjector([
      {
        provide: token,
        useValue: "foo",
      },
      {
        provide: token,
        useValue: "bar",
        ctx,
      }
    ]);
    
    const foo = await injector.resolve(token);
    const bar = await injector.resolve(token, { ctx });
    expect(foo).to.be.equal("foo");
    expect(bar).to.be.equal("bar");
  });

  it('ValueProvider - override', async () => {
    const token = "token";
    const ctx = new Context();

    const injector = createInjector([
      {
        provide: token,
        useValue: "foo",
      },
      {
        provide: token,
        useValue: "bar",
        ctx,
      },
      {
        provide: token,
        useValue: "foo",
        ctx,
      },
      {
        provide: token,
        useValue: "bar",
      },
    ]);
    
    const foo = await injector.resolve(token);
    const bar = await injector.resolve(token, { ctx });
    expect(foo).to.be.equal("bar");
    expect(bar).to.be.equal("foo");
  });

  it('ExistingProvider', async () => {
    class ServiceA {
      getFoo() {
        return "bar";
      }
    }

    @Injectable()
    class ServiceB {
      getFoo() {
        return "foo";
      }
    }

    const injector = createInjector([ServiceB, {
      provide: ServiceA,
      useExisting: ServiceB,
    }]);
    
    const instance = await injector.resolve(ServiceA);
    expect(instance instanceof ServiceB).to.be.true;
    expect(instance.getFoo()).to.be.equal("foo");
  });

  it('ExistingProvider - context', async () => {
    const token = "token";
    const ctx = new Context();

    const injector = createInjector([
      {
        provide: token,
        useValue: "foo",
      },
      {
        provide: token,
        useValue: "bar",
        ctx,
      },
      {
        provide: "useExisting",
        useExisting: token,
      },
      {
        provide: "useExistingCtx",
        useExisting: token,
        ctx,
      }
    ]);
    
    const foo = await injector.resolve("useExisting");
    const bar = await injector.resolve("useExistingCtx");
    expect(foo).to.be.equal("foo");
    expect(bar).to.be.equal("bar");
  });

  it('ExistingProvider - default value', async () => {
    const injector = createInjector([
      {
        provide: "useExisting",
        useExisting: "token",
        default: "defaultValue"
      }
    ]);
    
    const value = await injector.resolve("useExisting");
    expect(value).to.be.equal("defaultValue");
  });

  it('ExistingProvider - array of providers', async () => {
    const token = "token";
    const ctx = new Context();

    const injector = createInjector([
      {
        provide: token,
        useValue: "foo",
      },
      {
        provide: token,
        useValue: "bar",
        ctx,
      },
      {
        provide: "token2",
        useFactory: async () => "asyncFoo",
      },
      {
        provide: "useExisting",
        useExisting: ["token", { token, ctx }, "token2", { token: "foobar", default: "defaultValue" }],
      },
    ]);
    
    const array = await injector.resolve("useExisting");
    expect(array).to.be.deep.equal(["foo", "bar", "asyncFoo", "defaultValue"]);
  });

  it('MultiProvider', async () => {
    const token = new InjectionToken<string>({ multi: true });

    const injector = createInjector([
      {
        provide: token,
        useValue: "foo",
      },
      {
        provide: token,
        useValue: "bar",
      },
      {
        provide: token,
        useFactory: async () => "asyncFoo",
      },
    ]);
    
    const foo = await injector.resolve(token);
    expect(foo).to.be.deep.equal(["foo", "bar", "asyncFoo"]);
  });
});
