import type { ClassType, AbstractClassType } from '../types';

export function isExtended(target: ClassType | AbstractClassType) {
  return Object.getPrototypeOf(target) !== Object.prototype;
}
