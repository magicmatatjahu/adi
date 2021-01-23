import { createInjector } from "../../../src/di/injector";
import { Inject, Injectable, Named } from "../../../src/di/decorators";
import { InjectionToken } from "../../../src/di/tokens";
import { named } from "../../../src/di/constraints";
import { Scope } from "../../../src/di/scopes";
import { expect } from 'chai';

describe('MultiProvider', () => {
  it('basic case', async () => {
    @Injectable()
    class TypeClass {}
    @Injectable()
    class ConstructorClass {}

    const PROVIDERS = new InjectionToken<string>({ multi: true });

    const injector = createInjector([
      TypeClass,
      {
        provide: "useClass",
        useValue: "useClassValue",
      },
      {
        provide: ConstructorClass,
        inject: [],
      },
      {
        provide: PROVIDERS,
        useValue: "foo",
      },
      {
        provide: PROVIDERS,
        useValue: "bar",
      },
      {
        provide: PROVIDERS,
        useExisting: TypeClass,
      },
      {
        provide: PROVIDERS,
        useFactory: async () => "asyncFoo",
      },
      {
        provide: PROVIDERS,
        useExisting: ConstructorClass,
      },
      {
        provide: PROVIDERS,
        useExisting: "useClass",
      },
    ]);
    
    const values = await injector.resolve(PROVIDERS);
    const typeClass = await injector.resolve(TypeClass);
    const constructorClass = await injector.resolve(ConstructorClass);
    expect(values).to.be.deep.equal(["foo", "bar", typeClass, "asyncFoo", constructorClass, "useClassValue"]);
  });

  it('constraints case', async () => {
    const PROVIDERS = new InjectionToken<string>({ multi: true });

    @Injectable()
    class Service {
      constructor(
        @Inject(PROVIDERS) public values: string[],
        @Inject(PROVIDERS) @Named("ctx") public constraintValues: string[],
      ) {}
    }

    const injector = createInjector([
      Service,
      {
        provide: PROVIDERS,
        useValue: "foo",
      },
      {
        provide: PROVIDERS,
        useValue: "bar",
      },
      {
        provide: PROVIDERS,
        useValue: "fooCtx",
        when: named("ctx"),
      },
      {
        provide: PROVIDERS,
        useValue: "barCtx",
        when: named("ctx"),
      },
    ]);
    
    const service = await injector.resolve(Service);
    expect(service.values).to.be.deep.equal(["foo", "bar"]);
    expect(service.constraintValues).to.be.deep.equal(["foo", "bar", "fooCtx", "barCtx"]);
  });

  it('on every injection new value (array) is created when scope is PROTOTPE (default scope)', async () => {
    const PROVIDERS = new InjectionToken<string>({ multi: true });

    const injector = createInjector([
      {
        provide: PROVIDERS,
        useValue: "foo",
      },
      {
        provide: PROVIDERS,
        useValue: "bar",
      },
    ]);
    
    const values1 = await injector.resolve(PROVIDERS);
    const values2 = await injector.resolve(PROVIDERS);
    expect(values1).to.be.deep.equal(["foo", "bar"]);
    expect(values1).to.be.deep.equal(values2);
    expect(values1).to.be.not.equal(values2);
  });

  it('scope overiding works', async () => {
    const PROVIDERS = new InjectionToken<string>({ multi: true, scope: Scope.SINGLETON });

    const injector = createInjector([
      {
        provide: PROVIDERS,
        useValue: "foo",
      },
      {
        provide: PROVIDERS,
        useValue: "bar",
      },
    ]);
    
    const values1 = await injector.resolve(PROVIDERS);
    const values2 = await injector.resolve(PROVIDERS);
    expect(values1).to.be.deep.equal(["foo", "bar"]);
    expect(values1).to.be.deep.equal(values2);
    expect(values1).to.be.equal(values2);
  });

  it('scope in items works', async () => {
    const PROVIDERS = new InjectionToken<any>({ multi: true });

    const injector = createInjector([
      {
        provide: PROVIDERS,
        useFactory: () => {
          return {}
        },
        scope: Scope.TRANSIENT,
      },
    ]);
    
    const values1 = await injector.resolve(PROVIDERS);
    const values2 = await injector.resolve(PROVIDERS);
    expect(values1).to.not.be.equal(values2);
    expect(values1[0]).to.not.be.equal(values2[0]);
  });

  it('item without scope has persistence', async () => {
    const PROVIDERS = new InjectionToken<any>({ multi: true });

    const injector = createInjector([
      {
        provide: PROVIDERS,
        useFactory: () => {
          return {}
        }
      },
    ]);
    
    const values1 = await injector.resolve(PROVIDERS);
    const values2 = await injector.resolve(PROVIDERS);
    expect(values1).to.not.be.equal(values2);
    expect(values1[0]).to.be.equal(values2[0]);
  });
});
