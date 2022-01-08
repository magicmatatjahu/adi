import { Session } from "../injector";
import { destroy } from "../injector/destroy-manager";
import { DestroyableType, InstanceRecord, NextWrapper } from "../interfaces";
import { createWrapper, thenable } from "../utils";

function createDestroyable<T>(instance: InstanceRecord<T>): DestroyableType<T> | never {
  if (instance === undefined) {
    throw new Error('instance must to be defined to create the Destroyable instance!');
  }
  return {
    value: instance.value,
    destroy: () => destroy(instance, 'manually'),
  }
}

function wrapper(session: Session, next: NextWrapper) {
  return thenable(
    () => next(session),
    () => createDestroyable(session.instance),
  );
}

export const Destroyable = createWrapper(() => wrapper, { name: 'Destroyable' });
