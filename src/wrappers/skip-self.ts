import { Injector, Session, NilInjector } from "../injector";
import { NextWrapper } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(injector: Injector, session: Session, next: NextWrapper) {
  const token = session.getToken();
  let parentInjector = injector.getParentInjector();

  // check for treeshakable provider
  injector.getRecord(token);
  const ownRecord = (injector as any).records.get(token);

  while (parentInjector !== NilInjector) {
    parentInjector.getRecord(token);
    if (
      (parentInjector as any).records.get(token) ||
      (parentInjector as any).importedRecords.get(token) !== ownRecord
    ) {
      return next(parentInjector, session);
    }
    parentInjector = parentInjector.getParentInjector();
  }
  return next(NilInjector, session);
}

export const SkipSelf = createWrapper<undefined, false>(() => wrapper);
