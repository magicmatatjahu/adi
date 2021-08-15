import { NilInjector } from "../injector";
import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";
import { createWrapper as cr } from "../utils/wrappers.new";

function wrapper(): WrapperDef {
  return (injector, session, next) => {
    const token = session.getToken();
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

export const NewSkipSelf = cr<undefined, false>(wrapper);
export const SkipSelf = createWrapper(wrapper);
