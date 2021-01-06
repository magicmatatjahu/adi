import { Injectable, createInjector } from "@adi/core";
import { ServiceLocator } from "../../services/service-locator.service";
import { expect } from 'chai';

describe('ServiceLocator', () => {
  it('should retrieve singleton instance in every injector', async () => {
    const injector1 = createInjector([]);
    const injector2 = createInjector([]);
    const serviceLocator1 = await injector1.resolve(ServiceLocator);
    const serviceLocator2 = await injector2.resolve(ServiceLocator);

    expect(serviceLocator1 instanceof ServiceLocator).to.be.true;
    expect(serviceLocator2 instanceof ServiceLocator).to.be.true;
    expect(serviceLocator1 !== serviceLocator2).to.be.true;
  });

  it('should resolve provider', async () => {
    @Injectable()
    class Service {}

    const injector = createInjector([Service]);
    const serviceLocator = await injector.resolve(ServiceLocator);
    const service = await serviceLocator.resolve(Service);

    expect(service instanceof Service).to.be.true;
  });
});
