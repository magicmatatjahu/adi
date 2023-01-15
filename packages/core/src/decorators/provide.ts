import { provideMixin } from '../injector';
import { getDecoratorInfo } from '../utils';

import type { ProvideOptions } from '../interfaces';

export function Provide(options?: ProvideOptions): MethodDecorator {
  return function(target: Function, key: string | symbol, descriptor: PropertyDescriptor) {
    const decoratorInfo = getDecoratorInfo(target, key, descriptor);
    const statement = decoratorInfo.kind === 'method' && decoratorInfo.static;
    if (!statement) {
      throw new Error('@Provide decorator can be only used on method level.');
    }
    provideMixin(target, { methodName: decoratorInfo.key, static: decoratorInfo.static }, options);
  }
}
