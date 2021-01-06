import { createInjector } from "../../../src/di/injector";
import { Injectable, Inject, New } from "../../../src/di/decorators";
import { Context } from "../../../src/di/tokens";
import { Scope } from "../../../src/di/scopes";
import { expect } from 'chai';

describe('Scope', () => {
  it('should throw error when user want to inject new Singleton scoped provider', async () => {
    @Injectable({
      scope: Scope.SINGLETON,
    })
    class SingletonService {}

    @Injectable()
    class Service {
      constructor(
        readonly singletonService: SingletonService,
      ) {}
    }

    @Injectable()
    class ErrorNewService {
      constructor(
        @New() readonly singletonService: SingletonService,
      ) {}
    }

    @Injectable()
    class ErrorCtxService {
      constructor(
        @Inject(new Context()) readonly singletonService: SingletonService,
      ) {}
    }
  
    const injector = createInjector([
      SingletonService,
      Service,
      ErrorNewService,
      ErrorCtxService,
    ]);
    const service = await injector.resolve(Service);
    const singletonService = await injector.resolve(SingletonService);

    expect(service instanceof Service).to.be.true;
    expect(service.singletonService).to.be.equal(singletonService);
    expect(singletonService instanceof SingletonService).to.be.true;

    let error = undefined;
    try {
      await injector.resolve(ErrorNewService);
    } catch(err) {
      error = err;
    }
    expect(error).not.to.be.undefined;

    error = undefined;
    try {
      await injector.resolve(ErrorCtxService);
    } catch(err) {
      error = err;
    }
    expect(error).not.to.be.undefined;
  });

  it('should inject new provider with Transient scope by class provider', async () => {
    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TransientService {
    }

    @Injectable()
    class Service1 {
      constructor(
        readonly transientService: TransientService,
      ) {}
    }

    @Injectable()
    class Service2 {
      constructor(
        readonly transientService: TransientService,
      ) {}
    }

    const injector = createInjector([TransientService, Service1, Service2]);
    const transient = await injector.resolve(TransientService);
    const service1 = await injector.resolve(Service1);
    const service2 = await injector.resolve(Service2);

    expect(transient instanceof TransientService).to.be.true;
    expect(service1.transientService).not.to.be.equal(transient);
    expect(service1.transientService instanceof TransientService).to.be.true;
    expect(service2.transientService).not.to.be.equal(transient);
    expect(service2.transientService instanceof TransientService).to.be.true;
    expect(service1.transientService).not.to.be.equal(service2.transientService);
  });

  it('should not inheritance scope', async () => {
    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TransientService {
    }

    @Injectable()
    class ExtendTransientService extends TransientService {
    }


    @Injectable()
    class Service1 {
      constructor(
        readonly transientService: ExtendTransientService,
      ) {}
    }

    @Injectable()
    class Service2 {
      constructor(
        readonly transientService: ExtendTransientService,
      ) {}
    }

    const injector = createInjector([ExtendTransientService, Service1, Service2]);
    const extendTransient = await injector.resolve(ExtendTransientService);
    const service1 = await injector.resolve(Service1);
    const service2 = await injector.resolve(Service2);

    expect(extendTransient instanceof ExtendTransientService).to.be.true;
    expect(service1.transientService).to.be.equal(extendTransient);
    expect(service2.transientService).to.be.equal(extendTransient);
  });

  it('should inject new provider with Transient scope by custom (useFactory) provider', async () => {
    const token = "Token"
    class Service {}
  
    const injector = createInjector([
      {
        provide: token,
        useFactory: () => {
          return new Service();
        },
        scope: Scope.TRANSIENT,
      },
    ]);
    const transient1 = await injector.resolve<Service>(token);
    const transient2 = await injector.resolve<Service>(token);

    expect(transient1 instanceof Service).to.be.true;
    expect(transient2 instanceof Service).to.be.true;
    expect(transient1).not.to.be.equal(transient2);
  });

  it('should custom scope works', async () => {
    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class TransientService {}

    const injector = createInjector([TransientService]);
    const transient1 = await injector.resolve(TransientService);
    const transient2 = await injector.resolve(TransientService);

    expect(transient1 instanceof TransientService).to.be.true;
    expect(transient2 instanceof TransientService).to.be.true;
    expect(transient1).not.to.be.equal(transient2);
  });
});
