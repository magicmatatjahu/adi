import { createInjector } from "../../../src/di/injector";
import { Injectable } from "../../../src/di/decorators";
import { InjectionToken } from "../../../src/di/tokens";
import { expect } from 'chai';

describe('InjectionToken', () => {
  it('simple case', async () => {
    const token = new InjectionToken;
    const injector = createInjector([
      {
        provide: token,
        useValue: "rootInjector",
      },
    ]);

    const value = await injector.resolve(token);
    expect(value).to.be.equal("rootInjector");
  });

  it('case with custom provider - useValue', async () => {
    const token = new InjectionToken({
      providedIn: "any",
      useValue: "foobar"
    });

    const injector = createInjector([]);

    const value = await injector.resolve(token);
    expect(value).to.be.equal("foobar");
  });

  it('case with custom provider - useFactory', async () => {
    const token = new InjectionToken({
      providedIn: "any",
      useFactory: async () => "foobar",
    });

    const injector = createInjector([]);
    const value = await injector.resolve(token);
    expect(value).to.be.equal("foobar");
  });

  it('case with custom provider - useClass', async () => {
    @Injectable()
    class ServiceToInject {}

    @Injectable()
    class Service {
      constructor(public readonly service: ServiceToInject) {}
    }

    const token = new InjectionToken({
      providedIn: "any",
      useClass: Service
    });

    const injector = createInjector([
      ServiceToInject,
      Service,
    ]);

    const value = await injector.resolve(token);
    expect(value instanceof Service).to.be.true;
  });

  it('case with custom provider - useExisting', async () => {
    @Injectable()
    class ServiceToInject {}

    @Injectable()
    class Service {
      constructor(public readonly service: ServiceToInject) {}
    }

    const token = new InjectionToken({
      providedIn: "any",
      useFactory() {
        return [...arguments];
      },
      inject: [Service, ServiceToInject],
    });

    const injector = createInjector([
      ServiceToInject,
      Service,
    ]);

    const value = await injector.resolve(token);
    const service = await injector.resolve(Service);
    const serviceToInject = await injector.resolve(ServiceToInject);
    expect(service instanceof Service).to.be.true;
    expect(serviceToInject instanceof ServiceToInject).to.be.true;
    expect(value).to.be.deep.equal([service, serviceToInject]);
  });

  it('case with custom provider - complex case (with using another tree-shakable providers)', async () => {
    @Injectable({
      providedIn: "any",
    })
    class ServiceToInject {}

    @Injectable({
      providedIn: "any",
    })
    class Service {
      constructor(public readonly service: ServiceToInject) {}
    }

    const valueProvider = new InjectionToken({
      providedIn: "any",
      useValue: "foobar",
    });

    const token = new InjectionToken({
      providedIn: "any",
      useFactory() {
        return [...arguments];
      },
      inject: [Service, ServiceToInject, valueProvider],
    });

    const injector = createInjector([]);

    const value = await injector.resolve(token);
    const service = await injector.resolve(Service);
    const serviceToInject = await injector.resolve(ServiceToInject);
    expect(service instanceof Service).to.be.true;
    expect(serviceToInject instanceof ServiceToInject).to.be.true;
    expect(value).to.be.deep.equal([service, serviceToInject, "foobar"]);
  });

  it('case with custom provider and override it with custom provider defined in providers array', async () => {
    const valueProvider = new InjectionToken({
      providedIn: "any",
      useValue: "foobar",
    });

    const injector = createInjector([
      {
        provide: valueProvider,
        useFactory: () => "barfoo"
      }
    ]);

    const value = await injector.resolve(valueProvider);
    expect(value).to.be.equal("barfoo");
  });
});
