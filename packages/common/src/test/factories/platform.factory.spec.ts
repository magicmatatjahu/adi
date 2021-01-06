import { INJECTOR_SCOPE, INJECTOR_ID } from "@adi/core";
import { createPlatform } from "../../factories";
import { PLATFORM_ID } from "../../constants";
import { expect } from 'chai';

describe('createPlatform', () => {
  it('should works', async () => {
    const platformInjector = createPlatform("foo-platform");

    expect(await platformInjector.resolve(PLATFORM_ID)).to.be.equal("foo-platform");
    expect(await platformInjector.resolve(INJECTOR_ID)).to.be.equal("foo-platform");
    expect(await platformInjector.resolve(INJECTOR_SCOPE)).to.be.equal("platform");
  });

  it('should have (by default) as a parent core injector', async () => {
    const platformInjector = createPlatform("foo-platform");
    const parent = platformInjector.getParentInjector();
    expect(await parent.resolve(INJECTOR_SCOPE)).to.be.equal("core");
  });
});
