import { Injectable, createInjector } from "@adi/core";
import { DEFINITIONS } from "@adi/core/dist/src/di/constants";
import { Introspector } from "../../services/introspector.service";
import { expect } from 'chai';

describe('Introspector', () => {
  @Injectable()
  class Service {}

  it('should retrieve singleton instance from core injector', async () => {
    const injector1 = createInjector([]);
    const injector2 = createInjector([]);
    const introspector1 = await injector1.resolve(Introspector);
    const introspector2 = await injector2.resolve(Introspector);

    expect(introspector1 instanceof Introspector).to.be.true;
    expect(introspector2 instanceof Introspector).to.be.true;
    expect(introspector1 === introspector2).to.be.true;
  });

  it('should read provider def', async () => {
    const injector = createInjector([Service]);
    const introspector = await injector.resolve(Introspector);
    expect(introspector.getProviderDef(Service)).to.be.equal(Service[DEFINITIONS.PROVIDER]);
  });
});
