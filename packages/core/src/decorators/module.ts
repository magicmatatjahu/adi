import { moduleMixin, injectableMixin } from '../injector';
import { getDecoratorInfo } from '../utils';

import type { ClassType, ModuleMetadata } from '../interfaces';

export function Module(metadata?: ModuleMetadata): ClassDecorator {
  return function(target: Object, ...rest: any[]) {
    const { kind } = getDecoratorInfo(target, ...rest);
    if (kind !== 'class') {
      throw new Error('Cannot use @Module on non-class level.');
    }
    moduleMixin(target as ClassType, metadata);
    injectableMixin(target);
  }
}
