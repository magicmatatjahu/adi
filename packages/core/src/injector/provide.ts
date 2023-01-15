import { ADI_PROVIDE_DEF } from '../private';
import { createDefinition } from '../utils';

import type { AbstractClassType, ClassType, ProvideOptions, ProvideDefinition } from "../interfaces";

export const provideDefinitions = createDefinition<ProvideDefinition>(ADI_PROVIDE_DEF, provideFactory);

export function provideMixin(token: ClassType | AbstractClassType, method: { methodName: string | symbol, static?: boolean }, options: ProvideOptions): ProvideDefinition {
  const definition = provideDefinitions.ensure(token);
  const { methodName, static: isStatic } = method;
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
