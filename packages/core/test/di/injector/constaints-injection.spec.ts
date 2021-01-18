import { named, tagged, concatConstraints } from "../../../src/di/constraints";
import { Injectable, Inject, Named, Tagged } from "../../../src/di/decorators";
import { createInjector } from "../../../src/di/injector";
import { InjectionContext } from "../../../src/di/interfaces";
import { Context } from "../../../src/di/tokens";
import { expect } from 'chai';

describe('Constaints bindings', () => {
  it('basic case', async () => {
    @Injectable()
    class Service {}

    const ctx = new Context();

    const injector = createInjector([
      Service,
      {
        provide: Service,
        useValue: "useClassCtx",
        when: (ctxInjection: InjectionContext) => ctxInjection.ctx === ctx,
      },
    ]);
    
    const service = await injector.resolve(Service);
    const useValue = await injector.resolve(Service, { ctx });
    expect(service instanceof Service).to.be.true;
    expect(useValue).to.be.equal("useClassCtx");
  });

  it('override case', async () => {
    const token = "token";

    const injector = createInjector([
      {
        provide: token,
        useValue: "1",
        when: () => true,
      },
      {
        provide: token,
        useValue: "2",
        when: () => true,
      },
    ]);
    
    const value = await injector.resolve(token);
    expect(value).to.be.equal("2");
  });

  it('named case', async () => {
    const token = "token";

    @Injectable()
    class Service {
      constructor(
        @Inject(token) @Named("name1") public value1: string,
        @Inject(token) @Named("name2") public value2: string,
      ) {}
    }

    const injector = createInjector([
      Service,
      {
        provide: token,
        useValue: "1",
        when: named("name1"),
      },
      {
        provide: token,
        useValue: "2",
        when: named("name2"),
      },
    ]);
    
    const service = await injector.resolve(Service);
    expect(service.value1).to.be.equal("1");
    expect(service.value2).to.be.equal("2");
  });

  it('tagged case', async () => {
    const token = "token";

    @Injectable()
    class Service {
      constructor(
        @Inject(token) @Tagged("tag", true) public value1: string,
        @Inject(token) @Tagged("tag", false) public value2: string,
      ) {}
    }

    const injector = createInjector([
      Service,
      {
        provide: token,
        useValue: "1",
        when: tagged({ tag: false }),
      },
      {
        provide: token,
        useValue: "2",
        when: tagged({ tag: true }),
      },
    ]);
    
    const service = await injector.resolve(Service);
    expect(service.value1).to.be.equal("2");
    expect(service.value2).to.be.equal("1");
  });

  it('concatenate case', async () => {
    const token = "token";

    @Injectable()
    class Service {
      constructor(
        @Inject(token) @Named("name1") @Tagged("tag", true) public value1True: string,
        @Inject(token) @Named("name1") @Tagged("tag", false) public value1False: string,
        @Inject(token) @Named("name2") @Tagged("tag", true) public value2True: string,
        @Inject(token) @Named("name2") @Tagged("tag", false) public value2False: string,
      ) {}
    }

    const injector = createInjector([
      Service,
      {
        provide: token,
        useValue: "default",
      },
      {
        provide: token,
        useValue: "1",
        when: concatConstraints(named("name1"), tagged({ tag: false })),
      },
      {
        provide: token,
        useValue: "2",
        when: concatConstraints(named("name2"), tagged({ tag: true })),
      },
    ]);
    
    const service = await injector.resolve(Service);
    expect(service.value1True).to.be.equal("default");
    expect(service.value1False).to.be.equal("1");
    expect(service.value2True).to.be.equal("2");
    expect(service.value2False).to.be.equal("default");
  });
});
