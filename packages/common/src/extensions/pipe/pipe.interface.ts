export interface PipeTransform<T = any, R = any> {
  transform(value: T): R | Promise<R>; 
}
