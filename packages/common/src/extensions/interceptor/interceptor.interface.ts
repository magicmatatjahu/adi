export interface Interceptor<T = any, R = any> {
  intercept(context: any, next: (...args: any[]) => T): R | Promise<R>; 
}
