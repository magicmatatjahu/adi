import { createInjector } from "../../../src/di/injector";
import { Injectable, Inject } from "../../../src/di/decorators";
import { expect } from 'chai';

describe('Inheritance', () => {
  const token1 = "token1";
  const value1 = "value1";
  const provider1 = {
    provide: token1,
    useValue: value1,
  };

  const token2 = "token2";
  const value2 = "value2";
  const provider2 = {
    provide: token2,
    useValue: value2,
  };

  const token3 = "token3";
  const value3 = "value3";
  const provider3 = {
    provide: token3,
    useValue: value3,
  };

  const token4 = "token4";
  const value4 = "value4";
  const provider4 = {
    provide: token4,
    useValue: value4,
  };

  const symbol = Symbol.for("symbol");

  @Injectable()
  class Service {}

  abstract class BaseClass {
    @Inject(token1) readonly propToken1: string;
    @Inject(token2) readonly propToken2: string;
    @Inject(token4) readonly [symbol]: string;

    constructor(
      @Inject(token1) public readonly ctorToken1: string,
      @Inject(token2) public readonly ctorToken2: string,
      public ctorService: Service,
    ) {}

    async method1(@Inject(token1) methodToken?: string) {
      return methodToken;
    }

    async method2(@Inject(token1) methodToken1?: string, @Inject(token2) methodToken2?: string) {
      return `${methodToken1}${methodToken2}`;
    }

    async method3(methodToken1: string, @Inject(token2) methodToken2?: string) {
      return `${methodToken1}${methodToken2}`;
    }
  }

  it('only extend case', async () => {
    @Injectable()
    class ExtendedClass extends BaseClass {}
  
    const injector = createInjector([
      ExtendedClass,
      Service,
      provider1,
      provider2,
      provider4,
    ]);
    
    const service = await injector.resolve(ExtendedClass);
    expect(service instanceof ExtendedClass).to.be.true;
    expect(service.ctorToken1).to.be.equal(value1);
    expect(service.ctorToken2).to.be.equal(value2);
    expect(service.ctorService).to.be.instanceOf(Service);
    expect(service.propToken1).to.be.equal(value1);
    expect(service.propToken2).to.be.equal(value2);
    expect(service[symbol]).to.be.equal(value4);
    expect(await service.method1()).to.be.equal(value1);
    expect(await service.method2()).to.be.equal(`${value1}${value2}`);
    expect(await service.method3("foo")).to.be.equal(`foo${value2}`);
  });

  it('override case', async () => {
    @Injectable()
    class ExtendedClass extends BaseClass {
      @Inject(token3) readonly propToken1: string;
      @Inject(token3) readonly [symbol]: string;

      constructor(
        @Inject(token3) public readonly ctorToken3: string,
        public ctorService: Service,
      ) {
        super(ctorToken3, ctorToken3, ctorService);
      }

      async method2(methodToken1: string, @Inject(token3) methodToken2?: string) {
        return `${methodToken1}${methodToken2}`;
      }
    }
  
    const injector = createInjector([
      ExtendedClass,
      Service,
      provider1,
      provider2,
      provider3,
      provider4,
    ]);
    
    const service = await injector.resolve(ExtendedClass);
    expect(service instanceof ExtendedClass).to.be.true;
    expect(service.ctorToken1).to.be.equal(value3);
    expect(service.ctorToken2).to.be.equal(value3);
    expect(service.ctorToken3).to.be.equal(value3);
    expect(service.ctorService).to.be.instanceOf(Service);
    expect(service.propToken1).to.be.equal(value3);
    expect(service.propToken2).to.be.equal(value2);
    expect(service[symbol]).to.be.equal(value3);
    expect(await service.method1()).to.be.equal(value1);
    expect(await service.method2("foo")).to.be.equal(`foo${value3}`);
    expect(await service.method3("foo")).to.be.equal(`foo${value2}`);
  });

  it('override case with deep inheritance', async () => {
    @Injectable()
    class ExtendedClass extends BaseClass {
      @Inject(token3) readonly propToken1: string;
      @Inject(token3) readonly [symbol]: string;

      constructor(
        @Inject(token3) public readonly ctorToken3: string,
        public ctorService: Service,
      ) {
        super(ctorToken3, ctorToken3, ctorService);
      }

      async method2(methodToken1: string, @Inject(token3) methodToken2?: string) {
        return `${methodToken1}${methodToken2}`;
      }
    }

    @Injectable()
    class DeepExtendedClass extends ExtendedClass {
      @Inject(token2) readonly propToken1: string;
      @Inject(token1) readonly [symbol]: string;

      async method1(@Inject(token3) methodToken?: string) {
        return methodToken;
      }
    }
  
    const injector = createInjector([
      DeepExtendedClass,
      Service,
      provider1,
      provider2,
      provider3,
      provider4,
    ]);
    
    const service = await injector.resolve(DeepExtendedClass);
    expect(service instanceof DeepExtendedClass).to.be.true;
    expect(service.ctorToken1).to.be.equal(value3);
    expect(service.ctorToken2).to.be.equal(value3);
    expect(service.ctorToken3).to.be.equal(value3);
    expect(service.ctorService).to.be.instanceOf(Service);
    expect(service.propToken1).to.be.equal(value2);
    expect(service.propToken2).to.be.equal(value2);
    expect(service[symbol]).to.be.equal(value1);
    expect(await service.method1()).to.be.equal(value3);
    expect(await service.method2("foo")).to.be.equal(`foo${value3}`);
    expect(await service.method3("foo")).to.be.equal(`foo${value2}`);
  });

  it('override case with pure function after inheritance', async () => {
    @Injectable()
    class ExtendedClass extends BaseClass {
      async method3(value?: string) {
        return value;
      }
    }
  
    const injector = createInjector([
      ExtendedClass,
      Service,
      provider1,
      provider2,
      provider3,
      provider4,
    ]);
    
    const service = await injector.resolve(ExtendedClass);
    expect(service instanceof ExtendedClass).to.be.true;
    expect(await service.method3()).to.be.undefined;
    expect(await service.method3("barfoobar")).to.be.equal("barfoobar");
  });

  it('override case with pure function after inheritance (method is decorated by @Inject)', async () => {
    @Injectable()
    class Service {
      method() {
        return "Service";
      }
    }

    @Injectable()
    class BaseClass {

      @Inject()
      method(service?: Service) {
        return service.method();
      }
    }

    @Injectable()
    class ExtendedClass extends BaseClass {
      method() {
        return "Override";
      }
    }
  
    const injector = createInjector([
      ExtendedClass,
    ]);
    
    const service = await injector.resolve(ExtendedClass);
    expect(service instanceof ExtendedClass).to.be.true;
    expect(service.method()).to.be.equal("Override");
  });

  it('override case with normal class (not abstract)', async () => {
    @Injectable()
    class NormalBaseClass {
      @Inject(token1) readonly propToken1: string;
      @Inject() readonly propService: Service;

      constructor(
        @Inject(token1) public readonly ctorToken1: string,
      ) {}
  
      async method1(@Inject(token1) methodToken?: string) {
        return methodToken;
      }

      async method2(value?: string, @Inject(token1) methodToken?: string) {
        return `${value}${methodToken}`;
      }
    }

    @Injectable()
    class ExtendedClass extends NormalBaseClass {
      @Inject(token3) readonly propToken1: string;

      constructor(
        @Inject(token2) public readonly ctorToken2: string,
      ) {
        super(ctorToken2);
      }

      async method2(value?: string) {
        return value;
      }
    }
  
    const injector = createInjector([
      ExtendedClass,
      Service,
      provider1,
      provider2,
      provider3,
      provider4,
    ]);
    
    const service = await injector.resolve(ExtendedClass);
    expect(service instanceof ExtendedClass).to.be.true;
    expect(service.ctorToken1).to.be.equal(value2);
    expect(service.ctorToken2).to.be.equal(value2);
    expect(service.propToken1).to.be.equal(value3);
    expect(service.propService).to.be.instanceOf(Service);
    expect(await service.method1()).to.be.equal(value1);
    expect(await service.method1("foo")).to.be.equal("foo");
    expect(await service.method2()).to.be.undefined;
    expect(await service.method2("foo")).to.be.equal("foo");
  });

  it('override case with empty constructor in child class', async () => {
    @Injectable()
    class NormalBaseClass {
      constructor(
        @Inject(token1) public readonly ctorToken1: string,
        @Inject(token2) public readonly ctorToken2: string,
      ) {}
    }

    @Injectable()
    class ExtendedClass extends NormalBaseClass {
      constructor() {
        super(value3, value4);
      }
    }

    const injector = createInjector([
      ExtendedClass,
      provider1,
      provider2,
      provider3,
      provider4,
    ]);

    const service = await injector.resolve(ExtendedClass);
    expect(service instanceof ExtendedClass).to.be.true;
    expect(service.ctorToken1).to.be.equal(value3);
    expect(service.ctorToken2).to.be.equal(value4);
  });
});
