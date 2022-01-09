import { createWrapper, Session, NextWrapper, SessionStatus, Type, ForwardRef, WrapperDef, resolveRef } from '@adi/core';
import { NilInjector } from '@adi/core/lib/injector';

function plainWrapper(session: Session, next: NextWrapper) {
  if (session.status & SessionStatus.DRY_RUN) {
    return next(session);
  }

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
      session.injector = parentInjector;
      return next(session);
    }
    parentInjector = parentInjector.getParent();
  }
  return NilInjector.get(token);
}

// TODO: fix that
function parentWrapper(injector?: Type | ForwardRef<Type>): WrapperDef {
  return (session, next) => {
    if (session.status & SessionStatus.DRY_RUN) {
      return next(session);
    }

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
        session.injector = parentInjector;
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
}, { name: 'SkipSelf' });
