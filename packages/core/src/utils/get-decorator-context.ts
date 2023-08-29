import type { ClassType, DecoratorContext } from '../types';

function isStatic(target: any) {
  return target.prototype ? true : false;
}

function getClass(target: any): ClassType {
  return target.prototype ? target : target.constructor;
}

export function getDecoratorContext(target: Object, key?: string | symbol, indexOrDescriptor?: number | PropertyDescriptor): DecoratorContext {
  if (key) {
    const klass = getClass(target);
    const _static = isStatic(target);

    const isNumber = typeof indexOrDescriptor === 'number';
    if (isNumber || indexOrDescriptor) {
      if (isNumber) {
        const descriptor = Object.getOwnPropertyDescriptor(target, key);
        return {
          kind: 'parameter',
          index: indexOrDescriptor,
          class: klass,
          descriptor,
          key,
          static: _static,
        }
      } else if (indexOrDescriptor.get || indexOrDescriptor.set) {
        return {
          kind: 'accessor',
          key,
          class: klass,
          descriptor: indexOrDescriptor,
          static: _static,
        }
      }
      return {
        kind: 'method',
        key,
        class: klass,
        descriptor: indexOrDescriptor,
        static: _static,
      }
    }

    return {
      kind: 'property',
      key,
      class: klass,
      static: _static,
    }
  }

  if (typeof indexOrDescriptor === 'number') {
    return {
      kind: 'parameter',
      index: indexOrDescriptor,
      class: getClass(target), 
      static: isStatic(target),
    }
  }

  return {
    kind: 'class',
    class: target as ClassType,
  }
}
