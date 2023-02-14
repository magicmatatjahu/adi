import type { ClassType } from '../interfaces';

// TODO: Add prototype value in decorator info

interface ClassDecorator {
  kind: 'class';
  class: ClassType;
}

interface ParameterDecorator {
  kind: 'parameter';
  index: number;
  class: ClassType;
  key?: string | symbol;
  descriptor?: PropertyDescriptor;
  static: boolean;
}

interface PropertyDecorator {
  kind: 'property';
  key: string | symbol;
  class: ClassType;
  static: boolean;
}

interface MethodDecorator {
  kind: 'method';
  key: string | symbol;
  class: ClassType;
  descriptor: PropertyDescriptor;
  static: boolean;
}

interface AccessorDecorator {
  kind: 'accessor';
  key: string | symbol;
  class: ClassType;
  descriptor: PropertyDescriptor;
  static: boolean;
}

export type Decorator = 
  | ClassDecorator
  | ParameterDecorator
  | PropertyDecorator
  | MethodDecorator 
  | AccessorDecorator;

function isStatic(target: any) {
  return target.prototype ? true : false;
}

function getClass(target: any): ClassType {
  return target.prototype ? target : target.constructor;
}

export function getDecoratorInfo(target: Object, key?: string | symbol, indexOrDescriptor?: number | PropertyDescriptor): Decorator {
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
