import { moduleMixin, injectableMixin } from '../injector';
import { getDecoratorContext } from '../utils';

import type { ClassType, ModuleMetadata } from '../types';

export function Module(metadata?: ModuleMetadata) {
  return function(target: Object, ...rest: any[]) {
    const { kind } = getDecoratorContext(target, ...rest);
    if (kind !== 'class') {
      throw new Error('Cannot use @Module on non-class level.');
    }
    
    moduleMixin(target as ClassType, metadata);
    injectableMixin(target as ClassType);
  }
}
