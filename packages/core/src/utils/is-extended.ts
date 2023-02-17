import type { ClassType, AbstractClassType } from '../interfaces';

export function isExtended(target: ClassType | AbstractClassType) {
  return Object.getPrototypeOf(target) !== Object.prototype;
}
