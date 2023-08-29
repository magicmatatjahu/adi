import { injectableMixin } from '../injector';
import { getDecoratorContext } from '../utils';

import type { InjectableOptions } from '../types';

export function Injectable(options?: InjectableOptions) {
  return function(target: Object, ...rest: any[]) {
    const { kind } = getDecoratorContext(target, ...rest);
    if (kind !== 'class') {
      throw new Error('@Injectable decorator can be only used on class level.');
    }
    injectableMixin(target, undefined, options);
  }
}
