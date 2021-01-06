import { createInjector } from "../../../src/di/injector";
import { Injectable } from "../../../src/di/decorators";
import { Context, InjectionToken } from "../../../src/di/tokens";
import { expect } from 'chai';

describe('MultiProvider', () => {
  it('basic case', async () => {
    @Injectable()
    class TypeClass {}
    @Injectable()
    class ConstructorClass {}

    const token = new InjectionToken<string>({ multi: true });
    const ctx = new Context();

    const injector = createInjector([
      TypeClass,
      {
        provide: "useClass",
        useValue: "useClassCtx",
        ctx,
      },
      {
        provide: ConstructorClass,
        inject: [],
      },
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
        useExisting: TypeClass,
      },
      {
        provide: token,
        useFactory: async () => "asyncFoo",
      },
      {
        provide: token,
        useExisting: "useClass",
        ctx,
      },
      {
        provide: token,
        useExisting: ConstructorClass,
      },
    ]);
    
    const values = await injector.resolve(token);
    const typeClass = await injector.resolve(TypeClass);
    const constructorClass = await injector.resolve(ConstructorClass);
    expect(values).to.be.deep.equal(["foo", "bar", typeClass, "asyncFoo", "useClassCtx", constructorClass]);
  });
});
