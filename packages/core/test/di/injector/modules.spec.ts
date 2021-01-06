import { createInjector } from "../../../src/di/injector";
import { Injectable, Inject, Module } from "../../../src/di/decorators";
import { DynamicModule } from "../../../src/di/interfaces";
import { MODULE_INITIALIZERS } from "../../../src/di/constants";
import { ModuleType } from "../../../src/di/enums";
import { expect } from 'chai';

describe('Modules', () => {
  it('basic logic', async () => {
    @Injectable()
    class Service {}

    @Module({
      providers: [
        Service,
      ],
    })
    class AppModule {}
  
    const injector = createInjector(AppModule);
    await injector.compile();
    const service = await injector.resolve(Service);
    expect(service instanceof Service).to.be.true;
  });

  it('should export works', async () => {
    @Injectable()
    class ExportedService {}

    @Injectable()
    class NotExportedService {}

    @Module({
      providers: [
        ExportedService,
        NotExportedService,
      ],
      exports: [
        ExportedService,
      ]
    })
    class ChildModule {}

    @Module({
      imports: [
        ChildModule,
      ],
    })
    class AppModule {}
  
    const injector = createInjector(AppModule);
    await injector.compile();
    const service = await injector.resolve(ExportedService);
    expect(service instanceof ExportedService).to.be.true;

    let error = undefined;
    try {
      await injector.resolve(NotExportedService);
    } catch(e) {
      error = e;
    }
    expect(error).not.to.be.undefined;
  });

  it('should export works with providedIn', async () => {
    @Module()
    class ChildModule {}

    @Module({
      imports: [
        ChildModule,
      ],
    })
    class AppModule {}

    @Injectable({
      providedIn: ChildModule,
      export: true,
    })
    class ExportedService {}

    @Injectable({
      providedIn: ChildModule,
    })
    class NotExportedService {}
  
    const injector = createInjector(AppModule);
    await injector.compile();

    const service = await injector.resolve(ExportedService);
    expect(service instanceof ExportedService).to.be.true;

    let error = undefined;
    try {
      await injector.resolve(NotExportedService);
    } catch(e) {
      error = e;
    }
    expect(error).not.to.be.undefined;
  });

  it(`should Dynamic Module works`, async () => {
    @Injectable()
    class ExportedService {}

    @Injectable()
    class NotExportedService {}

    @Module({})
    class ChildModule {
      static register(): DynamicModule {
        return {
          module: ChildModule,
          providers: [
            ExportedService,
            NotExportedService,
          ],
        }
      }

      static async asyncExport(): Promise<DynamicModule> {
        return {
          module: ChildModule,
          exports: [
            ExportedService,
          ],
        }
      }
    }

    @Module({
      imports: [
        ChildModule.register(),
        ChildModule.asyncExport(),
      ],
    })
    class AppModule {}

    const injector = createInjector(AppModule);
    await injector.compile();

    const childService = await injector.resolve(ExportedService);
    expect(childService instanceof ExportedService).to.be.true;

    let error = undefined;
    try {
      await injector.resolve(NotExportedService);
    } catch(e) {
      error = e;
    }
    expect(error).not.to.be.undefined;
  });

  it(`should be able to create a exported provider with dependencies in the host injector`, async () => {
    const customProvider = {
      provide: "provider",
      useValue: "Provider from BabyModule!",
    }

    @Injectable()
    class BabyNotExportedService {}

    @Injectable()
    class BabyExportedService {
      constructor(
        public readonly service: BabyNotExportedService,
      ) {}
    }

    @Module({
      providers: [
        BabyExportedService,
        BabyNotExportedService,
        customProvider,
      ],
      exports: [
        BabyExportedService,
        customProvider,
      ],
    })
    class BabyModule {}

    @Injectable()
    class ChildNotExportedService {}

    @Injectable()
    class ChildExportedService {
      constructor(
        public readonly service: ChildNotExportedService,
        public readonly babyService: BabyExportedService,
        @Inject("provider") public readonly value: string,
      ) {}
    }

    @Module({
      imports: [
        BabyModule,
      ],
      providers: [
        ChildExportedService,
        ChildNotExportedService,
      ],
      exports: [
        ChildExportedService,
        BabyModule,
      ],
    })
    class ChildModule {}

    @Module({
      imports: [
        ChildModule,
      ],
    })
    class AppModule {}
  
    const injector = createInjector(AppModule);
    await injector.compile();

    const childExportedService = await injector.resolve(ChildExportedService);
    expect(childExportedService instanceof ChildExportedService).to.be.true;
    expect(childExportedService.service instanceof ChildNotExportedService).to.be.true;
    expect(childExportedService.babyService instanceof BabyExportedService).to.be.true;
    expect(childExportedService.value).to.be.equal("Provider from BabyModule!");

    let error = undefined;
    try {
      await injector.resolve(ChildNotExportedService);
    } catch(e) {
      error = e;
    }
    expect(error).not.to.be.undefined;

    const babyExportedService = await injector.resolve(BabyExportedService);
    expect(babyExportedService instanceof BabyExportedService).to.be.true;
    expect(babyExportedService === childExportedService.babyService).to.be.true;

    error = undefined;
    try {
      await injector.resolve(BabyNotExportedService);
    } catch(e) {
      error = e;
    }
    expect(error).not.to.be.undefined;
  });

  it(`should works an INLINE type of module`, async () => {
    const customProvider = {
      provide: "provider",
      useValue: "Provider from ChildModule!",
    }

    @Injectable()
    class Service1 {}

    @Injectable()
    class Service2 {
      constructor(
        public readonly service: Service1,
        @Inject("provider") public readonly value: string,
      ) {}
    }

    @Module({
      type: ModuleType.INLINE,
      providers: [
        Service1,
        Service2,
        customProvider,
      ]
    })
    class ChildModule {}

    @Module({
      imports: [
        ChildModule,
      ],
    })
    class AppModule {}

    const injector = createInjector(AppModule);
    await injector.compile();

    const service2 = await injector.resolve(Service2);
    expect(service2 instanceof Service2).to.be.true;
    expect(service2.service instanceof Service1).to.be.true;
    expect(service2.value).to.be.equal("Provider from ChildModule!");
  });

  it(`should works an INLINE type of module with deep importing`, async () => {
    const customProvider = {
      provide: "provider",
      useValue: "Provider from BabyModule!",
    }

    @Injectable()
    class BabyNotExportedService {}

    @Injectable()
    class BabyExportedService {
      constructor(
        public readonly service: BabyNotExportedService,
        @Inject("provider") public readonly value: string,
      ) {}
    }

    @Module({
      type: ModuleType.INLINE,
      providers: [
        customProvider,
      ]
    })
    class ModuleWithCustomProvider {}

    @Module({
      imports: [
        ModuleWithCustomProvider
      ],
      providers: [
        BabyNotExportedService,
        BabyExportedService,
      ],
      exports: [
        BabyExportedService,
      ]
    })
    class BabyModule {}

    @Module({
      type: ModuleType.INLINE,
      imports: [
        BabyModule,
      ],
    })
    class ChildModule {}

    @Module({
      imports: [
        ChildModule,
      ],
    })
    class AppModule {}

    const injector = createInjector(AppModule);
    await injector.compile();

    const service = await injector.resolve(BabyExportedService);
    expect(service instanceof BabyExportedService).to.be.true;
    expect(service.service instanceof BabyNotExportedService).to.be.true;
    expect(service.value).to.be.equal("Provider from BabyModule!");

    let error = undefined;
    try {
      await injector.resolve(BabyNotExportedService);
    } catch(e) {
      error = e;
    }
    expect(error).not.to.be.undefined;
  });

  it(`should works an INLINE module with provider with providedIn`, async () => {
    @Module()
    class BabyModule {}

    @Module({
      type: ModuleType.INLINE,
      imports: [
        BabyModule,
      ]
    })
    class ChildModule {}

    @Module({
      imports: [
        ChildModule,
      ],
    })
    class AppModule {}

    @Injectable({
      providedIn: ChildModule,
    })
    class Service {}

    @Injectable({
      providedIn: BabyModule,
    })
    class NotExportedService {}
  
    const injector = createInjector(AppModule);
    await injector.compile();

    const service = await injector.resolve(Service);
    expect(service instanceof Service).to.be.true;

    let error = undefined;
    try {
      await injector.resolve(NotExportedService);
    } catch(e) {
      error = e;
    }
    expect(error).not.to.be.undefined;
  });

  it(`should works override in parent module with INLINE module`, async () => {
    @Module({
      type: ModuleType.INLINE,
      providers: [
        {
          provide: "token",
          useValue: "foobar",
        }
      ],
    })
    class ChildModule {}

    @Module({
      imports: [
        ChildModule,
      ],
      providers: [
        {
          provide: "token",
          useValue: "barfoo",
        }
      ],
    })
    class AppModule {}
  
    const injector = createInjector(AppModule);
    await injector.compile();

    const value = await injector.resolve("token");
    expect(value).to.be.equal("barfoo");
  });

  it(`should works override type of module -> SHARED to INLINE`, async () => {
    // by default is SHARED
    @Module({
      providers: [
        {
          provide: "token",
          useValue: "foobar",
        }
      ],
    })
    class ChildModule {}

    @Module({
      imports: [
        {
          type: ModuleType.INLINE,
          module: ChildModule,
        },
      ],
    })
    class AppModule {}
  
    const injector = createInjector(AppModule);
    await injector.compile();

    const value = await injector.resolve("token");
    expect(value).to.be.equal("foobar");
  });

  it(`should works override type of module -> INLINE to SHARED`, async () => {
    // by default is SHARED
    @Module({
      type: ModuleType.INLINE,
      providers: [
        {
          provide: "exported",
          useValue: "exported",
        },
        {
          provide: "notexported",
          useValue: "notexported",
        }
      ],
      exports: [
        "exported",
      ]
    })
    class ChildModule {}

    @Module({
      imports: [
        {
          type: ModuleType.SHARED,
          module: ChildModule,
        },
      ],
    })
    class AppModule {}
  
    const injector = createInjector(AppModule);
    await injector.compile();

    const value = await injector.resolve("exported");
    expect(value).to.be.equal("exported");

    let error = undefined;
    try {
      await injector.resolve("notexported");
    } catch(e) {
      error = e;
    }
    expect(error).not.to.be.undefined;
  });

  it(`should works module's initialization`, async () => {
    @Injectable()
    class Service {}

    let service: Service = undefined;
    let value: string = undefined;

    @Module({
      providers: [
        Service,
        {
          provide: "token",
          useFactory: () => "foobar",
        }
      ],
    })
    class AppModule {
      constructor(
        public appService: Service,
        @Inject("token") public appValue: string,
      ) {
        service = this.appService;
        value = this.appValue;
      }
    }

    const injector = createInjector(AppModule);
    await injector.compile();
    expect(service).to.be.instanceOf(Service);
    expect(value).to.be.equal("foobar");
  });

  it(`should works module's initialization with hierarchy`, async () => {
    @Injectable()
    class Service {}

    let appService: Service = undefined;
    let order: string[] = [];
    let uniqueServices: Service[] = [];

    // by default is SHARED
    @Module({
      providers: [
        Service
      ],
    })
    class BabyModule {
      constructor(
        public service: Service,
      ) {
        if (!uniqueServices.includes(this.service)) {
          order.push("B");
          uniqueServices.push(this.service);
        }
      }
    }

    @Module({
      imports: [
        BabyModule,
        {
          type: ModuleType.INLINE,
          module: BabyModule,
        },
        {
          type: ModuleType.INLINE,
          module: BabyModule,
        },
        {
          type: ModuleType.DOMAIN,
          module: BabyModule,
        },
      ],
    })
    class ChildModule {
      constructor(
        public service: Service,
      ) {
        if (!uniqueServices.includes(this.service)) {
          order.push("C");
          uniqueServices.push(this.service);
        }
      }
    }

    @Module({
      imports: [
        ChildModule,
        {
          type: ModuleType.INLINE,
          module: ChildModule,
        },
        {
          type: ModuleType.INLINE,
          module: ChildModule,
        },
        {
          type: ModuleType.DOMAIN,
          module: ChildModule,
        },
        {
          type: ModuleType.DOMAIN,
          module: ChildModule,
        },
        {
          type: ModuleType.INLINE,
          module: ChildModule,
        },
      ],
    })
    class AppModule {
      constructor(
        public service: Service,
      ) {
        order.push("A");
        appService = this.service;
      }
    }

    const injector = createInjector(AppModule);
    await injector.compile();
    expect(appService).to.be.instanceOf(Service);
    expect(uniqueServices.includes(appService)).to.be.true;
    // 1 from SHARED BabyModule, 1 from SHARED ChildModule (with inlined BabyModule)
    // 6 from DOMAIN, 1 from INLINE ChildModule (with inlined BabyModule) in AppModule
    expect(uniqueServices.length).to.be.equal(9);
  });

  it(`should works with processed parent providers`, async () => {
    let numberOfInits: number = 0;

    @Injectable()
    class Service {
      constructor() {
        numberOfInits++;
      }
    }

    @Module({
      type: ModuleType.DOMAIN,
    })
    class ChildModule {
      constructor(
        public service: Service,
      ) {}
    }

    @Module({
      imports: [
        ChildModule
      ],
      providers: [
        Service,
      ],
    })
    class AppModule {
      constructor(
        public service: Service,
      ) {}
    }

    const injector = createInjector(AppModule);
    await injector.compile();
    expect(numberOfInits).to.be.equal(1);
  });

  it(`should works with MODULE_INITIALIZERS`, async () => {
    const order: string[] = [];
    
    @Injectable()
    class Service {}

    @Module({
      providers: [
        {
          provide: MODULE_INITIALIZERS,
          useFactory: async () => {
            return () => order.push("ChildModule async factory");
          },
        },
        {
          provide: "service",
          useFactory: (service: Service) => {
            order.push("ChildModule Service");
          },
          inject: [Service],
        },
        {
          provide: MODULE_INITIALIZERS,
          useExisting: "service",
        },
        Service,
      ],
    })
    class ChildModule {}

    @Module({
      imports: [
        ChildModule
      ],
      providers: [
        {
          provide: "value",
          useValue: "AppModule useValue",
        },
        {
          provide: MODULE_INITIALIZERS,
          useFactory: (value: string) => {
            return () => order.push(value);
          },
          inject: ["value"],
        },
      ],
    })
    class AppModule {}

    const injector = createInjector(AppModule);
    await injector.compile();
    // ChildModule Service is executed first, because ADI first initializes MODULE_INITIALIZERS provider
    // then runs returned functions from providers
    expect(order).to.be.deep.equal([
      'ChildModule Service',
      'ChildModule async factory',
      'AppModule useValue'
    ]);
  });
});
