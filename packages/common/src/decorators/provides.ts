import { getDecoratorInfo, createDefinition } from '@adi/core/lib/utils';

import type { ClassType, AbstractClassType } from '@adi/core';
import type { ProvidesOptions, ProvideDefinition } from '../interfaces';

export const ADI_PROVIDE_DEF = 'adi:definition:provide';

export const providesDefinitions = createDefinition<ProvideDefinition>(ADI_PROVIDE_DEF, provideFactory);

export function providesMixin(token: ClassType | AbstractClassType, method: { methodName: string | symbol, static?: boolean } | string | symbol, options: ProvidesOptions): ProvideDefinition {
  const definition = providesDefinitions.ensure(token);

  let methodName: string | symbol, isStatic: boolean;
  if (typeof method === 'string' || typeof method === 'symbol') {
    methodName = method;
    isStatic = true;
  } else {
    methodName = method.methodName;
    isStatic = method.static;
  }

  const provides = isStatic ? definition.static : definition.prototype;
  provides[methodName] ? Object.assign(provides[methodName], options) : (provides[methodName] = options);
  return definition;
}

function provideFactory(): ProvideDefinition {
  return {
    prototype: {}, 
    static: {},
  };
}

export function Provides(options?: ProvidesOptions): MethodDecorator {
  return function(target: Function, key: string | symbol, descriptor: PropertyDescriptor) {
    const decoratorInfo = getDecoratorInfo(target, key, descriptor);
    const statement = decoratorInfo.kind === 'method' && decoratorInfo.static;
    if (!statement) {
      throw new Error('@Provides decorator can be only used on method level.');
    }
    providesMixin(target, { methodName: decoratorInfo.key, static: decoratorInfo.static }, options);
  }
}
