import { Injector, Session } from "../injector";
import { DestroyManager } from "../injector/destroy-manager";
import { DestroyableType, InstanceRecord, NewNextWrapper, NextWrapper } from "../interfaces";
import { createNewWrapper, createWrapper, thenable } from "../utils";

function createDestroyable<T>(instance: InstanceRecord<T>): DestroyableType<T> | never {
  if (instance === undefined) {
    throw new Error('instance must to be defined to create the Destroyable instance!');
  }
  return {
    value: instance.value,
    destroy: () => DestroyManager.destroy('manually', instance, instance.def.record.host),
  }
}

function wrapper(injector: Injector, session: Session, next: NextWrapper) {
  return thenable(
    () => next(injector, session),
    () => createDestroyable(session.instance),
  );
}

export const Destroyable = createWrapper<undefined, false>(() => wrapper);

function newWrapper(session: Session, next: NewNextWrapper) {
  return thenable(
    () => next(session),
    () => createDestroyable(session.instance),
  );
}

export const NewDestroyable = createNewWrapper(() => newWrapper);
