import { createInjector } from "../../../src/di/injector";
import { expect } from 'chai';

describe('factories', () => {
  describe('createInjector', () => {
    it('should works', async () => {
      const injector = createInjector([
        {
          provide: "token",
          useValue: "value",
        }
      ]);

      const value = await injector.resolve("token");
      expect(value).to.be.equal("value");
    });
  });
});
