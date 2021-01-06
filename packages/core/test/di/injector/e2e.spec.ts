import { createInjector } from "../../../src/di/injector";
import { Injectable, Inject, New } from "../../../src/di/decorators";
import { Context } from "../../../src/di/tokens";
import { Scope } from "../../../src/di/scopes";
import { expect } from 'chai';

import { AppModule } from "./e2e/app.module";
import { testProfile } from "./e2e/constants";

describe('E2E scenario', () => {
  it('should works', async () => {
    const appModule = createInjector(AppModule);
    await appModule.compile();

    expect(testProfile.initOrder).to.be.deep.equal(['AdminsModule', 'UsersModule', 'DBModule', 'AppModule']);
  });
});
