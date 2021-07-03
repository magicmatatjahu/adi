import { Injector, NilInjector } from "../injector";
import { InjectionSession, NextWrapper, WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(_: never): WrapperDef {
  // console.log('skipSelf');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside skipSelf');
    const token = session.options.token;
    let parentInjector = injector.getParentInjector();
    // check for treeshakable provider
    (injector as any).getRecord(token);
    const ownRecord = (injector as any).records.get(token);

    while (parentInjector !== NilInjector) {
      (parentInjector as any).getRecord(token);
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
}

export const SkipSelf = createWrapper(wrapper);
