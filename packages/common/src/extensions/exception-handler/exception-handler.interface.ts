export interface ExceptionHandler<T = any> {
  catch(exception: T): any; 
}
