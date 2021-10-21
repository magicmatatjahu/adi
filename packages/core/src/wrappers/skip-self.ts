import { NilInjector, Session } from "../injector";
import { ForwardRef, NextWrapper, Type, WrapperDef } from "../interfaces";
import { createWrapper, resolveRef } from "../utils";

function plainWrapper(session: Session, next: NextWrapper) {
  const injector = session.injector;
  const token = session.getToken();

  // check for treeshakable provider
  injector.getRecord(token);
  const ownRecord = injector.records.get(token);

  let parentInjector = injector.getParent();
  while (parentInjector !== NilInjector) {
    // check for treeshakable provider
    parentInjector.getRecord(token);
    const parentCollection = parentInjector.importedRecords.get(token);
    if (
      parentInjector.records.get(token) ||
      (ownRecord && (!parentCollection || parentCollection[parentCollection.length - 1] !== ownRecord))
    ) {
      return next(session);
    }
    parentInjector = parentInjector.getParent();
  }
  return NilInjector.get(token);
}

function parentWrapper(injector?: Type | ForwardRef<Type>): WrapperDef {
  return (session, next) => {
    const selfInjector = session.injector;
    injector = resolveRef(injector);
    const token = session.getToken();

    // check for treeshakable provider
    selfInjector.getRecord(token);
    const ownRecord = selfInjector.records.get(token);
  
    let parentInjector = selfInjector.getParent();
    while (parentInjector !== NilInjector) {
      // check for treeshakable provider
      parentInjector.getRecord(token);
      if (parentInjector.metatype === injector) {
        const parentCollection = parentInjector.importedRecords.get(token);
        if (
          !parentInjector.records.get(token) ||
          (ownRecord && (!parentCollection || parentCollection[parentCollection.length - 1] !== ownRecord))
        ) {
          break;
        }
        return next(session);
      }
      parentInjector = parentInjector.getParent();
    }
    return NilInjector.get(token);
  }
}

export const SkipSelf = createWrapper((injector?: Type | ForwardRef<Type>) => {
  if (injector) {
    return parentWrapper(injector);
  }
  return plainWrapper;
});
