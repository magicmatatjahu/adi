import { Type } from './type.interface';

export interface ExecutionContext {
  getClass<T = any>(): Type<T>;
  getHandler<P extends Array<any> = Array<any>, R = any>(): (...args: P) => R;
  getArgs<T extends Array<any> = any[]>(): T;
  getArgs<T = any>(index: number): T;
}
