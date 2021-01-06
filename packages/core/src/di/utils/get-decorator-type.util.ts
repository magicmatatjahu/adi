import { DecoratorType } from "../enums";

export function getDecoratorType(target: Object, key?: string | symbol, indexOrDescriptor?: number | PropertyDescriptor): DecoratorType {
  if (key === undefined) {
    if (indexOrDescriptor === undefined) {
      return DecoratorType.CLASS;
    }
    return DecoratorType.CONSTRUCTOR_PARAMETER;
  }
  if (indexOrDescriptor === undefined) {
    return checkStaticDecorator(target, DecoratorType.PROPERTY, DecoratorType.STATIC_PROPERTY);
  }
  if (typeof indexOrDescriptor === "number") {
    return checkStaticDecorator(target, DecoratorType.METHOD_PARAMETER, DecoratorType.STATIC_PARAMETER);
  }
  if (indexOrDescriptor.set === undefined) {
    if (indexOrDescriptor.get === undefined) {
      return checkStaticDecorator(target, DecoratorType.METHOD, DecoratorType.STATIC_METHOD);
    }
    return checkStaticDecorator(target, DecoratorType.GETTER_ACCESSOR, DecoratorType.STATIC_GETTER_ACCESSOR);
  }
  return checkStaticDecorator(target, DecoratorType.SETTER_ACCESSOR, DecoratorType.STATIC_SETTER_ACCESSOR);
}

function checkStaticDecorator(target: any, decoratorType: DecoratorType, staticDecoratorType: DecoratorType) {
  if (target.prototype === undefined) {
    return decoratorType;
  }
  return staticDecoratorType;
}
