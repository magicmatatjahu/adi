import { createInjector } from "@adi/core";
import { ENVIRONMENT_ID, ENVIRONMENT_NODE_ID } from "../../utils/environment.util";
import { expect } from 'chai';

describe('environment', () => {
  it('should create ENVIRONMENT_ID provider in CORE scope', async () => {
    const injector = createInjector([]);
    const value = await injector.resolve(ENVIRONMENT_ID);
    expect(value).to.be.equal(ENVIRONMENT_NODE_ID);
  });
});
