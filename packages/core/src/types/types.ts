export interface ClassType<T = any> extends Function {
  new (...args: any[]): T;
}

export interface AbstractClassType<T = any> extends Function {
  prototype: T;
}
