import { createInjector } from "../../../src/di/injector";
import { Injectable, Module, Inject, Optional, New, Self, SkipSelf } from "../../../src/di/decorators";
import { decorate } from "../../../src/di/utils";
import { expect } from 'chai';

describe('decorate', () => {
  it('should works for @Injectable()', async () => {
    class Service {}
    decorate(Injectable({ providedIn: "any" }), Service);

    const injector = createInjector([]);
    const service = await injector.resolve(Service);

    expect(service).to.be.instanceOf(Service);
  });

  it('should works for @Module()', async () => {
    class Service {}
    decorate(Injectable(), Service);

    class AppModule {}
    decorate(Module({ providers: [Service] }), AppModule);

    const injector = createInjector(AppModule);
    await injector.compile();
    const service = await injector.resolve(Service);

    expect(service).to.be.instanceOf(Service);
  });

  it('should works for @Inject()', async () => {
    const token = "token";
    const value = "value";

    class Service {
      constructor(
        public token: string,
      ) {}
    }
    decorate(Injectable(), Service);
    decorate(Inject(token), Service, 0);

    const injector = createInjector([
      Service,
      {
        provide: token,
        useValue: value,
      }
    ]);
    const service = await injector.resolve(Service);

    expect(service.token).to.be.equal(value);
  });

  it('should works for @Optional()', async () => {
    const token = "token";
    const value = "value";

    class Service {
      constructor(
        public token: string = value,
      ) {}
    }
    decorate(Injectable(), Service);
    decorate([Inject(token), Optional()], Service, 0);

    const injector = createInjector([
      Service,
    ]);
    const service = await injector.resolve(Service);

    expect(service.token).to.be.equal(value);
  });

  it('should works for @New()', async () => {
    class InjectService {}
    decorate(Injectable(), InjectService);
    class Service {
      constructor(
        public service: InjectService,
        public newService1: InjectService,
        public newService2: InjectService,
      ) {}
    }
    decorate(Injectable(), Service);
    decorate(Inject(InjectService), Service, 0);
    decorate([Inject(InjectService), New()], Service, 1);
    decorate([Inject(InjectService), New()], Service, 2);

    const injector = createInjector([
      InjectService,
      Service,
    ]);
    const service = await injector.resolve(Service);

    expect(service.service).to.be.instanceOf(InjectService);
    expect(service.newService1).to.be.instanceOf(InjectService);
    expect(service.newService2).to.be.instanceOf(InjectService);
    expect(service.service).not.to.be.equal(service.newService1);
    expect(service.service).not.to.be.equal(service.newService2);
    expect(service.newService1).not.to.be.equal(service.newService2);
  });

  it('should works for @Self() and @SkipSelf()', async () => {
    class InjectService {}
    decorate(Injectable(), InjectService);
    class Service {
      constructor(
        public self: InjectService,
        public skipSelf: InjectService,
      ) {}
    }
    decorate(Injectable(), Service);
    decorate([Inject(InjectService), Self()], Service, 0);
    decorate([Inject(InjectService), SkipSelf()], Service, 1);

    const rootInjector = createInjector([
      InjectService,
    ]);
    const childInjector = createInjector([
      InjectService,
      Service,
    ], rootInjector);

    const service = await childInjector.resolve(Service);
    expect(service.self).to.be.instanceOf(InjectService);
    expect(service.skipSelf).to.be.instanceOf(InjectService);
    expect(service.self).not.to.be.equal(service.skipSelf);
  });

  it('should works for properties', async () => {
    const token = "token";
    const value = "value";

    const symbol = Symbol.for("prop");

    class Service {
      public prop: string;
      public [symbol]: string;

    }
    decorate(Injectable(), Service);
    decorate(Inject(token), Service, "prop");
    decorate(Inject(token), Service, symbol);

    const injector = createInjector([
      Service,
      {
        provide: token,
        useValue: value,
      }
    ]);
    const service = await injector.resolve(Service);

    expect(service.prop).to.be.equal(value);
    expect(service[symbol]).to.be.equal(value);
  });

  it('should works for methods', async () => {
    const token = "token";
    const value = "value";

    class Service {
      async method(token?: string) {
        return token;
      }
    }
    decorate(Injectable(), Service);
    decorate(Inject(token), Service, "method", 0);

    const injector = createInjector([
      Service,
      {
        provide: token,
        useValue: value,
      }
    ]);
    const service = await injector.resolve(Service);

    expect(await service.method()).to.be.equal(value);
  });
});
