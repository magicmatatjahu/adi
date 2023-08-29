import { getDecoratorContext } from "./get-decorator-context";

import type { DecoratorFunction, DecoratorClassFunction, DecoratorParameterFunction, DecoratorPropertyFunction, DecoratorAccessorFunction, DecoratorMethodFunction } from "../types";

export function createDecorator(decorator: DecoratorClassFunction): ClassDecorator;
export function createDecorator(decorator: DecoratorParameterFunction): ParameterDecorator;
export function createDecorator(decorator: DecoratorPropertyFunction): PropertyDecorator;
export function createDecorator(decorator: DecoratorAccessorFunction): PropertyDecorator;
export function createDecorator(decorator: DecoratorMethodFunction): MethodDecorator;
export function createDecorator(decorator: DecoratorFunction): ClassDecorator | ParameterDecorator | PropertyDecorator | MethodDecorator {
  return function <T>(target: Object, key: string | symbol, indexOrDescriptor: number | TypedPropertyDescriptor<T>) {
    const details = getDecoratorContext(target, key, indexOrDescriptor);
    return (decorator as Function)(details);
  }
}

