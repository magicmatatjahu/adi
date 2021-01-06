import { INJECTOR_SCOPE, INJECTOR_ID } from "@adi/core";
import { createApplication } from "../../factories";
import { APPLICATION_ID } from "../../constants";
import { expect } from 'chai';

describe('createApplication', () => {
  it('should works', async () => {
    const appInjector = createApplication("foo-app");

    expect(await appInjector.resolve(APPLICATION_ID)).to.be.equal("foo-app");
    expect(await appInjector.resolve(INJECTOR_ID)).to.be.equal("foo-app");
    expect(await appInjector.resolve(INJECTOR_SCOPE)).to.be.equal("app");
  });

  it('should have (by default) as a parent core injector', async () => {
    const platformInjector = createApplication("foo-app");
    const parent = platformInjector.getParentInjector();
    expect(await parent.resolve(INJECTOR_SCOPE)).to.be.equal("core");
  });
});
