import { Injector, NilInjector, Session } from "../injector";
import { ForwardRef, NextWrapper, Type, WrapperDef } from "../interfaces";
import { createWrapper, resolveRef } from "../utils";

function plainWrapper(injector: Injector, session: Session, next: NextWrapper) {
  const token = session.getToken();

  // check for treeshakable provider
  injector.getRecord(token);
  const ownRecord = (injector as any).records.get(token);

  let parentInjector = injector.getParent();
  while (parentInjector !== NilInjector) {
    // check for treeshakable provider
    parentInjector.getRecord(token);
    if (
      parentInjector.records.get(token) ||
      (ownRecord && parentInjector.importedRecords.get(token) !== ownRecord)
    ) {
      return next(parentInjector, session);
    }
    parentInjector = parentInjector.getParent();
  }
  return next(NilInjector, session);
}

function parentWrapper(injector?: Type | ForwardRef<Type>): WrapperDef {
  return (selfInjector, session, next) => {
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
        if (
          !parentInjector.records.get(token) ||
          (ownRecord && parentInjector.importedRecords.get(token) === ownRecord)
        ) {
          break;
        }
        return next(parentInjector, session);
      }
      parentInjector = parentInjector.getParent();
    }
    return next(NilInjector, session);
  }
}

function wrapper(injector?: Type | ForwardRef<Type>): WrapperDef {
  if (injector) {
    return parentWrapper(injector);
  }
  return plainWrapper;
}

export const SkipSelf = createWrapper<Type | ForwardRef<Type>, false>(wrapper);
