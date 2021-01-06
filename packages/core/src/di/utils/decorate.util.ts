export function decorate<T = ClassDecorator | PropertyDecorator | ParameterDecorator>(
  decorators: T | Array<T>,
  target: Object, 
  keyOrIndex?: string | symbol | number, 
  index?: number,
): void {
  if (typeof keyOrIndex === "number") {
    if (Array.isArray(decorators)) {
      for (let i = 0, l = decorators.length; i < l; i++) {
        (decorators[i] as any as Function)(target, undefined, keyOrIndex);
      }
    } else {
      (decorators as any as Function)(target, undefined, keyOrIndex);
    }
  } else if (keyOrIndex) {
    if (Array.isArray(decorators)) {
      for (let i = 0, l = decorators.length; i < l; i++) {
        (decorators[i] as any as Function)((target as any).prototype, keyOrIndex, index);
      }
    } else {
      (decorators as any as Function)((target as any).prototype, keyOrIndex, index);
    }
  } else {
    if (Array.isArray(decorators)) {
      for (let i = 0, l = decorators.length; i < l; i++) {
        (decorators[i] as any as Function)(target);
      }
    } else {
      (decorators as any as Function)(target);
    }
  }
}
