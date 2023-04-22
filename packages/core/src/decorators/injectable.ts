import { injectableMixin } from '../injector';
import { getDecoratorInfo } from '../utils';

import type { InjectableOptions } from '../interfaces';

export function Injectable(options?: InjectableOptions): ClassDecorator {
  return function(target: Object, ...rest: any[]) {
    const { kind } = getDecoratorInfo(target, ...rest);
    if (kind !== 'class') {
      throw new Error('@Injectable decorator can be only used on class level.');
    }
    injectableMixin(target, undefined, options);
  }
}
