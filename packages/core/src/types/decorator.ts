import { ClassType } from "./types";

export interface ClassDecoratorContext<T = any> {
  kind: 'class';
  class: ClassType<T>;
}

export interface ParameterDecoratorContext<T = any> {
  kind: 'parameter';
  index: number;
  class: ClassType<T>;
  key?: string | symbol;
  descriptor?: PropertyDescriptor;
  static: boolean;
}

export interface PropertyDecoratorContext<T = any> {
  kind: 'property';
  key: string | symbol;
  class: ClassType<T>;
  static: boolean;
}

export interface AccessorDecoratorContext<T = any, P = any> {
  kind: 'accessor';
  key: string | symbol;
  class: ClassType<T>;
  descriptor: TypedPropertyDescriptor<P>;
  static: boolean;
}

export interface MethodDecoratorContext<T = any, P = any> {
  kind: 'method';
  key: string | symbol;
  class: ClassType<T>;
  descriptor: TypedPropertyDescriptor<P>;
  static: boolean;
}

export type DecoratorContext<T = any, P = any> = 
  | ClassDecoratorContext<T>
  | ParameterDecoratorContext<T>
  | PropertyDecoratorContext<T>
  | AccessorDecoratorContext<T, P>
  | MethodDecoratorContext<T, P>;

export type DecoratorClassFunction<I = any> = <T = any>(input: I, ctx: ClassDecoratorContext<T>) => ClassType<T>;
export type DecoratorParameterFunction<I = any> = <T = any>(input: I, ctx: ParameterDecoratorContext<T>) => void;
export type DecoratorPropertyFunction<I = any> = <T = any>(input: I, ctx: PropertyDecoratorContext<T>) => void;
export type DecoratorAccessorFunction<I = any> = <T = any, P = any>(input: I, ctx: AccessorDecoratorContext<T, P>) => void;
export type DecoratorMethodFunction<I = any> = <T = any, P = any>(input: I, ctx: MethodDecoratorContext<T>) => TypedPropertyDescriptor<P>;

export type DecoratorFunction =
  | DecoratorClassFunction
  | DecoratorParameterFunction
  | DecoratorPropertyFunction
  | DecoratorAccessorFunction
  | DecoratorMethodFunction;
