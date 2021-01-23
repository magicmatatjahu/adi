import { createInjector } from "../../../src/di/injector";
import { Injectable, Inject, Lazy, New, Optional, Self, SkipSelf, Module } from "../../../src/di/decorators";
import { ModuleType } from "../../../src/di/enums";
import { Context } from "../../../src/di/tokens";
import { INQUIRER, INQUIRER_PROTO, CONTEXT, INJECTOR_SCOPE } from "../../../src/di/providers";
import { STATIC_CONTEXT } from "../../../src/di/constants";
import { Scope } from "../../../src/di/scopes";
import { expect } from 'chai';

describe('Injection flags', () => {
  @Injectable()
  class TestServiceA {}

  @Injectable()
  class TestServiceB {}

  it('basic injection', async () => {
    const injector = createInjector([TestServiceA, TestServiceB]);
    
    const serviceA = await injector.resolve(TestServiceA);
    expect(serviceA).not.to.be.undefined;
    expect(serviceA instanceof TestServiceA).to.be.true;
    expect(serviceA).to.be.equal(await injector.resolve(TestServiceA));
    const serviceB = await injector.resolve(TestServiceB);
    expect(serviceB).not.to.be.undefined;
    expect(serviceB instanceof TestServiceB).to.be.true;
    expect(serviceB).to.be.equal(await injector.resolve(TestServiceB));
  });

  it('constructor injection', async () => {
    @Injectable()
    class ConstructorInjection {
      constructor(
        public readonly serviceA: TestServiceA,
        @Inject() public readonly serviceB: TestServiceB,
      ) {}
    }

    const injector = createInjector([TestServiceA, TestServiceB, ConstructorInjection]);
    
    const instance = await injector.resolve(ConstructorInjection);
    expect(instance.serviceA).to.be.equal(await injector.resolve(TestServiceA));
    expect(await injector.resolve(TestServiceA)).not.to.be.undefined;
    expect(instance.serviceB).to.be.equal(await injector.resolve(TestServiceB));
    expect(await injector.resolve(TestServiceB)).not.to.be.undefined;
  });

  it('property injection', async () => {
    @Injectable()
    class PropertyInjection {
      @Inject()
      public readonly serviceA: TestServiceA;

      @Inject(TestServiceB)
      public readonly serviceB: TestServiceA;
    }

    const injector = createInjector([TestServiceA, TestServiceB, PropertyInjection]);
    
    const instance = await injector.resolve(PropertyInjection);
    expect(instance.serviceA).to.be.equal(await injector.resolve(TestServiceA));
    expect(await injector.resolve(TestServiceA)).not.to.be.undefined;
    expect(instance.serviceB).to.be.equal(await injector.resolve(TestServiceB));
    expect(await injector.resolve(TestServiceB)).not.to.be.undefined;
  });

  it('setter injection', async () => {
    @Injectable()
    class SetterInjection {
      public _serviceA: TestServiceA;

      @Inject(TestServiceA)
      public set serviceA(serviceA: TestServiceA) {
          this._serviceA = serviceA;
      }
    }

    const injector = createInjector([TestServiceA, SetterInjection]);

    const instance = await injector.resolve(SetterInjection);
    expect(instance._serviceA).to.be.equal(await injector.resolve(TestServiceA));
  });

  it('setter injection - infer type', async () => {
    @Injectable()
    class SetterInjection {
      public _serviceA: TestServiceA;

      @Inject()
      set serviceA(serviceA: TestServiceA) {
        this._serviceA = serviceA;
      }
    }

    const injector = createInjector([TestServiceA, SetterInjection]);

    const instance = await injector.resolve(SetterInjection);
    expect(instance._serviceA).to.be.equal(await injector.resolve(TestServiceA));
  });

  it('property (symbol) injection', async () => {
    const a = Symbol.for("a");
    const b = Symbol.for("b");

    @Injectable()
    class SymbolInjection {
      @Inject()
      [a]: TestServiceA;

      @Inject(TestServiceB)
      [b]: any;
    }

    const injector = createInjector([TestServiceA, TestServiceB, SymbolInjection]);
    const service = await injector.resolve(SymbolInjection);
    expect(service[a]).to.be.equal(await injector.resolve(TestServiceA));
    expect(service[b]).to.be.equal(await injector.resolve(TestServiceB));
  });

  it('@Inject() inject flag - InjectionToken injection', async () => {
    const token = "token";

    @Injectable()
    class TokenInjection {
      constructor(
        @Inject(token) public readonly foobar: string,
      ) {}
    }

    const injector = createInjector([TokenInjection, { provide: token, useValue: "foobar" }]);
    
    const instance = await injector.resolve(TokenInjection);
    expect(instance.foobar).to.be.equal("foobar");
  });

  it('@Inject() inject flag - context injection', async () => {
    const ctx1 = new Context();
    const ctx2 = new Context();

    @Injectable()
    class ContextInjection {
      constructor(
        @Inject(ctx1) public readonly serviceACtx1: TestServiceA,
        @Inject(ctx2) public readonly serviceACtx2: TestServiceA,
        public readonly serviceA: TestServiceA,
      ) {}
    }

    const injector = createInjector([TestServiceA, ContextInjection]);
    
    const instance = await injector.resolve(ContextInjection);
    expect(instance.serviceACtx1).to.not.be.equal(instance.serviceA);
    expect(instance.serviceACtx1).to.be.equal(await injector.resolve(TestServiceA, { ctx: ctx1 }));
    expect(instance.serviceACtx2).to.not.be.equal(instance.serviceA);
    expect(instance.serviceACtx2).to.be.equal(await injector.resolve(TestServiceA, { ctx: ctx2 }));
    expect(instance.serviceACtx1).to.not.be.equal(instance.serviceACtx2);
  });

  // it('@Inject() inject flag - token & context injection', async () => {
  //   const token = "token";
  //   const ctx = new Context();

  //   @Injectable()
  //   class TokenAndContextInjection {
  //     constructor(
  //       @Inject(token) public readonly foobar: string,
  //       @Inject(token, ctx) public readonly foobarCtx: string,
  //     ) {}
  //   }

  //   const injector = createInjector([
  //     TokenAndContextInjection, 
  //     { provide: token, useValue: "foobar" },
  //     { provide: token, useValue: "barfoo" },
  //   ]);
    
  //   const instance = await injector.resolve(TokenAndContextInjection);
  //   expect(instance.foobar).to.be.equal("foobar");
  //   expect(instance.foobarCtx).to.be.equal("barfoo");
  // });

  it('@Inject() inject flag - skip injection', async () => {
    @Injectable()
    class SkipInjection {
      constructor(
        @Inject(false) public readonly noInjected: TestServiceA,
        public readonly service: TestServiceA,
      ) {}
    }
    
    const injector = createInjector([TestServiceA, SkipInjection]);

    const instance = await injector.resolve(SkipInjection);
    expect(instance.noInjected).to.be.undefined;
    expect(instance.service).to.be.equal(await injector.resolve(TestServiceA));
  });

  it('@Lazy() inject flag - property injection', async () => {
    @Injectable()
    class Service {
      @Inject() @Lazy()
      service: TestServiceA;
    }
    
    const injector = createInjector([Service, TestServiceA]);

    const instance = await injector.resolve(Service);
    const testInstance = await injector.resolve(TestServiceA);
    expect(instance.service).to.be.equal(testInstance);

    // override value
    const newTestInstance = new TestServiceA();
    instance.service = newTestInstance;
    expect(instance.service).to.be.equal(newTestInstance);
  });

  it('@Lazy() inject flag - setter injection is not supported', async () => {
    let error = undefined;
    try {
      @Injectable()
      class Service {
        public _serviceA: TestServiceA;
  
        @Inject() @Lazy()
        set serviceA(serviceA: TestServiceA) {
          this._serviceA = serviceA;
        }
      }
    } catch(err) {
      error = err;
    }
    expect(error.message).to.be.equal("Lazy injection works only in property injection (also not in setter)");
  });

  it('@New() inject flag - useValue', async () => {
    @Injectable()
    class NewInjection {
      constructor(
        @New() public readonly service1: TestServiceA,
        @New() public readonly service2: TestServiceA,
      ) {}
    }
    
    const injector = createInjector([NewInjection, TestServiceA]);

    const instance = await injector.resolve(NewInjection);
    expect(instance.service1).to.be.instanceOf(TestServiceA);
    expect(instance.service2).to.be.instanceOf(TestServiceA);
    expect(instance.service1).not.to.be.equal(instance.service2);
  });

  it('@Optional() inject flag', async () => {
    @Injectable()
    class OptionalService {
      constructor(
        @Optional() public readonly undefinedValue: string,
        @Optional() public readonly fallbackValue: string = "foobar",
      ) {}
    }
    
    const injector = createInjector([OptionalService]);

    const instance = await injector.resolve(OptionalService);
    expect(instance.undefinedValue).to.be.undefined;
    expect(instance.fallbackValue).to.be.equal("foobar");
  });

  it("@Optional() inject flag - throw error when instance doesn't exists", async () => {
    @Injectable()
    class OptionalService {
      constructor(
        public readonly undefinedValue: string,
      ) {}
    }
    
    const injector = createInjector([OptionalService]);

    let error = undefined;
    try {
      await injector.resolve(OptionalService);
    } catch(err) {
      error = err;
    }
    expect(error).not.to.be.undefined;
  });

  it('@Self() and @SkipSelf() inject flags - basic usage', async () => {
    const firstToken = "firstToken";
    const secondToken = "secondToken";

    @Injectable()
    class Service {
      constructor(
        @Self() @Inject(firstToken) public readonly injectorFirstToken: string,
        @SkipSelf() @Inject(firstToken) public readonly parentInjectorFirsToken: string,
        @Self() @Inject(secondToken) public readonly injectorSecondToken: string,
        @SkipSelf() @Inject(secondToken) public readonly parentInjectorSecondToken: string,
      ) {}
    }

    const rootInjector = createInjector([
      {
        provide: firstToken,
        useValue: "rootInjector",
      },
      {
        provide: secondToken,
        useValue: "rootInjector",
      }
    ]);
    const childInjector = createInjector([
      {
        provide: firstToken,
        useValue: "childInjector",
      },
    ], rootInjector);
    const babyInjector = createInjector([
      {
        provide: firstToken,
        useValue: "babyInjector",
      },
      {
        provide: secondToken,
        useValue: "babyInjector",
      },
      Service,
    ], childInjector);

    const instance = await babyInjector.resolve(Service);

    expect(instance.injectorFirstToken).to.be.equal("babyInjector");
    expect(instance.parentInjectorFirsToken).to.be.equal("childInjector");
    expect(instance.injectorSecondToken).to.be.equal("babyInjector");
    expect(instance.parentInjectorSecondToken).to.be.equal("rootInjector");
  });

  it("@Self() and @SkipSelf() inject flags - complex cases", async () => {
    const rootToken = "rootToken";
    const childToken = "childToken";

    @Injectable()
    class Service {}

    @Injectable()
    class SkipSelfService {
      constructor(
        @SkipSelf() @Inject(childToken) public readonly value: string,
      ) {}
    }

    @Injectable()
    class SelfService {
      constructor(
        @Self() @Inject(rootToken) public readonly value: string,
      ) {}
    }

    @Injectable()
    class OptionalService {
      constructor(
        @Optional() @Self() @Inject(rootToken) public readonly rootToken: string,
        @Optional() @SkipSelf() @Inject(childToken) public readonly childToken: string = "defaultValue",
        @SkipSelf() public readonly rootService: Service,
        public readonly childService: Service,
      ) {}
    }

    const rootInjector = createInjector([
      {
        provide: rootToken,
        useValue: "rootInjector",
      },
      Service,
    ]);
    const childInjector = createInjector([
      {
        provide: childToken,
        useValue: "childInjector",
      },
      SkipSelfService,
      SelfService,
      OptionalService,
      Service,
    ], rootInjector);

    let error = undefined;
    try {
      await childInjector.resolve(SkipSelfService);
    } catch(e) {
      error = e;
    }
    expect(error).not.to.be.undefined;

    error = undefined;
    try {
      await childInjector.resolve(SelfService);
    } catch(e) {
      error = e;
    }
    expect(error).not.to.be.undefined;

    let instance = await childInjector.resolve(OptionalService);

    expect(instance.rootToken).to.be.undefined;
    expect(instance.childToken).to.be.equal("defaultValue");
    expect(instance.rootService instanceof Service).to.be.true;
    expect(instance.childService instanceof Service).to.be.true;
    expect(instance.rootService === instance.childService).to.be.false;
  });

  // TODO: fix test
  it('@Self() and @SkipSelf() inject flags - exports case', async () => {
    const rootToken = "rootToken";
    const childToken = "childToken";

    @Injectable()
    class SkipSelfService {
      constructor(
        @SkipSelf() @Inject(childToken) public readonly value: string,
      ) {}
    }

    @Injectable()
    class SelfService {
      constructor(
        @Self() @Inject(rootToken) public readonly value: string,
      ) {}
    }

    @Module({
      type: ModuleType.DOMAIN,
      providers: [
        {
          provide: rootToken,
          useValue: "rootToken",
        },
      ],
      exports: [
        rootToken,
      ]
    })
    class BabyModule {}

    @Module({
      type: ModuleType.DOMAIN,
      imports: [
        BabyModule,
      ],
      providers: [
        {
          provide: childToken,
          useValue: "childToken",
        },
        SkipSelfService,
        SelfService,
      ],
      exports: [
        childToken,
      ]
    })
    class ChildModule {}

    @Module({
      imports: [
        ChildModule,
      ],
      providers: [
        {
          provide: rootToken,
          useValue: "rootToken",
        },
      ],
    })
    class RootModule {}

    const injector = createInjector(RootModule);
    await injector.compile();
    // TODO: Fix typo
    const childInjector = (injector as any).imports.get(ChildModule).values.values().next().value.value;
    console.log(childInjector);

    let error = undefined;
    try {
      await childInjector.resolve(SkipSelfService);
    } catch(e) {
      error = e;
    }
    expect(error).not.to.be.undefined;

    error = undefined;
    try {
      await childInjector.resolve(SelfService);
    } catch(e) {
      error = e;
    }
    expect(error).not.to.be.undefined;
  });

  it('Custom decorators', async () => {
    function InjectToken() {
      return Inject("token");
    }

    function InjectToken2() {
      return function(target: Object, key: string | symbol, index?: number) {
        Inject("token2")(target, key);
        Optional()(target, key, index);
      }
    }

    @Injectable()
    class Service {
      constructor(
        @InjectToken() public readonly token1: string,
        @InjectToken2() public readonly token2: string,
      ) {}
    }

    const injector = createInjector([
      Service,
      {
        provide: "token",
        useValue: "rootInjector",
      },
    ]);

    const service = await injector.resolve(Service);
    expect(service.token1).to.be.equal("rootInjector");
    expect(service.token2).to.be.undefined;
  });

  it('Context injection as a props/parameter type', async () => {
    const order: string[] = [];

    const value = {
      text: "value from context",
    };
    const newValue = {
      text: "value from new context",
    };
    const ctx = new Context(value);

    @Injectable()
    class ContextService {
      @Inject(CONTEXT)
      public readonly ctxProp: Context;

      constructor(
        @Inject(CONTEXT) public readonly ctxCtor: Context,
      ) {}

      onInit() {
        order.push("ContextService");
      }
    }

    @Injectable()
    class ContextInjection {
      @Inject(CONTEXT)
      public readonly ctxProp: Context;

      constructor(
        @Inject(CONTEXT) public readonly ctxCtor1: Context,
        @Inject(CONTEXT) public readonly ctxCtor2: Context,
        public readonly service: ContextService,
        @Inject(ctx) public readonly ctxService: ContextService,
        @New(newValue) public readonly newCtxService: ContextService,
      ) {}

      onInit() {
        order.push("ContextInjection");
      }
    }

    const injector = createInjector([ContextInjection, ContextService]);
    const instance = await injector.resolve(ContextInjection);

    expect(instance.ctxCtor1).to.be.equal(STATIC_CONTEXT);
    expect(instance.ctxProp).to.be.equal(STATIC_CONTEXT);
    expect(instance.ctxCtor2).to.be.equal(STATIC_CONTEXT);
    expect(instance.service).not.to.be.equal(instance.ctxService);
    expect(instance.service.ctxProp).to.be.equal(STATIC_CONTEXT);
    expect(instance.ctxService.ctxCtor).to.be.equal(ctx);
    expect(instance.ctxService.ctxCtor.getData()).to.be.equal(value);
    expect(instance.ctxService.ctxProp).to.be.equal(ctx);
    expect(instance.ctxService.ctxProp.getData()).to.be.equal(value);
    expect(instance.newCtxService.ctxCtor).not.to.be.equal(STATIC_CONTEXT);
    expect(instance.newCtxService.ctxCtor.getData()).to.be.equal(newValue);
    expect(instance.newCtxService.ctxProp).not.to.be.equal(STATIC_CONTEXT);
    expect(instance.newCtxService.ctxProp.getData()).to.be.equal(newValue);
    expect(order).to.be.deep.equal([
      'ContextService',
      'ContextService',
      'ContextService',
      'ContextInjection'
    ]);
  });

  // TODO: Fix it - sometimes (in Circular Deps) it creates second instance of Inquirered type
  it.skip('INQUIRER injection as a props/parameter type', async () => {
    const order: string[] = [];
    const ctx = new Context();

    @Injectable()
    class ChildInquireredService {
      constructor(
        @Inject(INQUIRER) public readonly inquirer: any,
      ) {}

      onInit() {
        order.push("ChildInquireredService");
      }
    }

    @Injectable()
    class InquireredService {
      constructor(
        @Inject(INQUIRER_PROTO) public readonly inquirerPrototype: any,
        @Inject(INQUIRER) public readonly inquirer: any,
        public readonly childInquirer: ChildInquireredService,
      ) {}

      onInit() {
        order.push("InquireredService");
      }
    }

    @Injectable()
    class InquirerService {
      constructor(
        @Inject(ctx) public readonly service: InquireredService,
      ) {}

      onInit() {
        order.push("InquirerService");
      }
    }

    const injector = createInjector([InquirerService, InquireredService, ChildInquireredService]);
    const instance = await injector.resolve(InquirerService);

    expect(instance.service.inquirerPrototype).to.be.equal(InquirerService.prototype);
    expect(instance.service.inquirer).to.be.equal(instance);
    expect(instance.service.childInquirer.inquirer).to.be.equal(instance.service);
    expect(order).to.be.deep.equal(['ChildInquireredService', 'InquireredService', 'InquirerService']);
  });

  // TODO: fix it
  // it('SPECIAL_TOKENS injection in method injection', async () => {
  //   @Injectable()
  //   class InquirerService {
  //     async method(
  //       @Inject(INQUIRER) inquirer?: any,
  //       @Inject(INQUIRER_PROTO) inquirer_proto?: any,
  //       @Inject(CONTEXT) ctx?: any,
  //     ) {
  //       return [inquirer, inquirer_proto, ctx];
  //     }
  //   }

  //   const injector = createInjector([InquirerService]);
  //   const instance = await injector.resolve(InquirerService);
  //   console.log(await instance.method())
  // });

  it('SPECIAL_TOKENS injection in useFactory', async () => {
    const ctx = new Context();

    @Injectable()
    class InquirerService {
      constructor(
        @Inject("token", ctx) public values: any[],
      ) {}
    }

    // const injector = createInjector([InquirerService, {
    //   provide: "token",
    //   useFactory: (inquirer, inquirer_proto, ctx) => {
    //     return [inquirer, inquirer_proto, ctx];
    //   },
    //   inject: [INQUIRER, INQUIRER_PROTO, CONTEXT],
    // }]);
    const injector = createInjector([InquirerService, {
      provide: "token",
      useFactory: (_ctx) => {
        return [_ctx];
      },
      inject: [CONTEXT],
    }]);

    const instance = await injector.resolve(InquirerService);
    // expect(instance.values[0]).to.be.equal(instance);
    // expect(instance.values[1]).to.be.equal(InquirerService.prototype);
    expect(instance.values[0]).to.be.equal(ctx);
  });

  it('ProvidedIn injection - ANY case', async () => {
    @Injectable({
      providedIn: "any",
    })
    class Service {
      constructor() {}
    }

    const rootInjector = createInjector([]);
    const childInjector = createInjector([], rootInjector);
    const babyInjector = createInjector([], childInjector);

    const rootInstance = await rootInjector.resolve(Service);
    expect(rootInstance instanceof Service).to.be.true;
    const childInstance = await childInjector.resolve(Service);
    expect(childInstance instanceof Service).to.be.true;
    const babyInstance = await babyInjector.resolve(Service);
    expect(babyInstance instanceof Service).to.be.true;

    expect(rootInstance === childInstance).to.be.false;
    expect(rootInstance === babyInstance).to.be.false;
    expect(childInstance === babyInstance).to.be.false;
  });

  it('ProvidedIn injection - CORE case', async () => {
    @Injectable({
      providedIn: "core",
    })
    class Service {
      constructor() {}
    }

    const injector1 = createInjector([]);
    const injector2 = createInjector([]);
    const service1 = await injector1.resolve(Service);
    const service2 = await injector2.resolve(Service);

    expect(service1 instanceof Service).to.be.true;
    expect(service1 === service2).to.be.true;
  });

  it('ProvidedIn injection - PLATFORM and APP cases', async () => {
    @Injectable({
      providedIn: "platform",
    })
    class PlatformService {
      constructor() {}
    }

    @Injectable({
      providedIn: "app",
    })
    class AppService {
      constructor() {}
    }

    const platformInjector = createInjector([{ provide: INJECTOR_SCOPE, useValue: "platform" }]);
    const appInjector1 = createInjector([{ provide: INJECTOR_SCOPE, useValue: "app" }], platformInjector);
    const appInjector2 = createInjector([{ provide: INJECTOR_SCOPE, useValue: "app" }], platformInjector);
    
    const platformService1 = await appInjector1.resolve(PlatformService);
    const platformService2 = await appInjector2.resolve(PlatformService);
    expect(platformService1 instanceof PlatformService).to.be.true;
    expect(platformService1 === platformService2).to.be.true;

    const appService1 = await appInjector1.resolve(AppService);
    const appService2 = await appInjector2.resolve(AppService);
    expect(appService1 instanceof AppService).to.be.true;
    expect(appService2 instanceof AppService).to.be.true;
    expect(appService1 === appService2).to.be.false;
  });

  it('ProvidedIn injection - Module case', async () => {
    @Module()
    class Module1 {}

    @Module()
    class Module2 {}

    @Injectable({
      providedIn: Module1,
    })
    class Module1Service {
      constructor() {}
    }

    @Injectable({
      providedIn: Module2,
    })
    class Module2Service {
      constructor() {}
    }

    const moduleInjector1 = createInjector(Module1);
    const moduleInjector2 = createInjector(Module2);

    const service1 = await moduleInjector1.resolve(Module1Service);
    const service2 = await moduleInjector2.resolve(Module2Service);
    expect(service1 instanceof Module1Service).to.be.true;
    expect(service2 instanceof Module2Service).to.be.true;
  });

  it('Method injection - parameter', async () => {
    @Injectable()
    class Service {
      constructor() {}

      method(arg: string) {
        return `method injection is ${arg}`;
      }
    }

    @Injectable()
    class MethodInjectionService {
      constructor() {}

      async method(arg: string, @Inject() serviceOrString?: Service): Promise<string> {
        if (typeof serviceOrString === "string") {
          return serviceOrString;
        }
        if (serviceOrString) {
          return serviceOrString!.method(arg);
        }
        return "empty";
      }
    }

    const injector = createInjector([Service, MethodInjectionService]);
    const instance = await injector.resolve(MethodInjectionService);
    expect(await instance.method("awesome")).to.be.equal("method injection is awesome");
    expect(await instance.method("awesome", undefined)).to.be.equal("method injection is awesome");
    expect(await instance.method("awesome", "override" as any)).to.be.equal("override");
  });

  it('Method injection - wrap @Inject on function', async () => {
    @Injectable()
    class ServiceA {
      method() {
        return "ServiceA";
      }
    }

    @Injectable()
    class ServiceB {
      method() {
        return "ServiceB";
      }
    }

    @Injectable()
    class MethodInjectionService {
      constructor() {}

      @Inject()
      async method(serviceA?: ServiceA, serviceB?: ServiceB): Promise<string> {
        return serviceA.method() + serviceB.method();
      }
    }

    const injector = createInjector([ServiceA, ServiceB, MethodInjectionService]);
    const instance = await injector.resolve(MethodInjectionService);
    expect(await instance.method()).to.be.equal("ServiceAServiceB");
  });

  it('Method injection - wrap @Inject on function with params - should throw error', async () => {
    let error = undefined;
    try {
      @Injectable()
      class Service {
        constructor() {}
  
        @Inject("token")
        method(): void {}
      }
  
      const injector = createInjector([Service]);
    } catch(err) {
      error = err;
    }
    expect(error.message).to.be.equal("Cannot pass arguments to decorator on wrapping method");
  });

  it('Method injection - function and parameter override', async () => {
    @Injectable()
    class ServiceA {
      method() {
        return "ServiceA";
      }
    }

    @Injectable()
    class ServiceB {
      method() {
        return "ServiceB";
      }
    }

    @Injectable()
    class ServiceC {
      method() {
        return "ServiceC";
      }
    }

    @Injectable()
    class MethodInjectionService {
      constructor() {}

      @Inject()
      async method(@Inject(ServiceC) serviceC?: ServiceA, serviceA?: ServiceA, @Inject(ServiceA) serviceB?: ServiceB): Promise<string> {
        return serviceC.method() + serviceA.method() + serviceB.method();
      }
    }

    const injector = createInjector([ServiceA, ServiceB, ServiceC, MethodInjectionService]);
    const instance = await injector.resolve(MethodInjectionService);
    expect(await instance.method()).to.be.equal("ServiceCServiceAServiceA");
  });

  it('Method injection - working with advanced injection flag', async () => {
    const ctx = new Context();
    const transientCtx = new Context();
    let numberOfInc = 0;

    @Injectable()
    class Service {
      constructor() {
        this.increment();
      }

      increment() {
        numberOfInc++;
      }
    }

    @Injectable({ scope: Scope.TRANSIENT })
    class TransientService {
      constructor(
        private service: Service,
        @New() private newService: Service,
      ) {
        this.increment();
      }

      increment() {
        numberOfInc++;
      }
    }

    @Injectable()
    class MethodInjectionService {
      constructor() {}

      async run(@Inject() staticCtx?: Service, @Inject(ctx) definedCtx?: Service, @Inject() @New() newCtx?: Service): Promise<void> {}
      async runNew(@Inject() @New() newCtx?: Service): Promise<void> {}
      async runTransient(@Inject(transientCtx) transientWithCtx?: TransientService, @Inject() newTransient?: TransientService): Promise<void> {}
    }

    const injector = createInjector([Service, MethodInjectionService, TransientService]);
    const instance = await injector.resolve(MethodInjectionService);
    await instance.run();
    // three different context
    expect(numberOfInc).to.be.equal(3);
    // call another time and only for newCtx parameter should create new instance
    await instance.run();
    expect(numberOfInc).to.be.equal(4);

    await instance.runNew();
    expect(numberOfInc).to.be.equal(5);
    await instance.runNew();
    expect(numberOfInc).to.be.equal(6);

    // first create transient Provider with given ctx -> cache it, then on every next call create another transient provider without caching.
    await instance.runTransient();
    // additional calls by new Service, due to @New() decorator
    expect(numberOfInc).to.be.equal(10);
    await instance.runTransient();
    // Transient + @New() Service
    expect(numberOfInc).to.be.equal(12);
    await instance.runTransient();
    // Transient + @New() Service
    expect(numberOfInc).to.be.equal(14);
  });

  it('Synchronous injection', async () => {
    @Injectable()
    class ServiceToInject {}

    @Injectable()
    class Service {
      public foobar: string = undefined;

      @Inject("service")
      public serviceProp: ServiceToInject;

      constructor(
        public service: ServiceToInject,
      ) {}

      onInit() {
        this.foobar = "barfoo";
      }
    }

    const injector = createInjector([Service, ServiceToInject, {
      provide: "service",
      useFactory: (service: ServiceToInject) => {
        return service;
      },
      inject: [ServiceToInject],
    }]);

    const service = injector.resolveSync(Service) as Service;
    expect(service.foobar).to.be.equal("barfoo");
    expect(service.service).to.be.instanceOf(ServiceToInject);
    expect(service.serviceProp).to.be.instanceOf(ServiceToInject);
    expect(service.service).to.be.equal(service.serviceProp);
  });
});
