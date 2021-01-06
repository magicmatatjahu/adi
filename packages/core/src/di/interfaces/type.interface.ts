export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}

export interface AbstractType<T> extends Function {
  prototype: T;
}
