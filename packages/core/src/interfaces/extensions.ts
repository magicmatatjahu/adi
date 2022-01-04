import { InjectionItem } from '.';
import { ExecutionContext } from '../injector/execution-context';
import { FunctionInjections } from './injection.interface';
import { Type } from './type.interface';

export interface Interceptor<R = any> {
  intercept(context: ExecutionContext, next: Function): R | Promise<R>;
};

export interface StandaloneInterceptor<R = any> extends FunctionInjections {
  intercept(context: ExecutionContext, next: Function, ...injections: any[]): R | Promise<R>;
};

export interface Guard {
  canPerform(context: ExecutionContext): boolean | Promise<boolean> | any;
};

export interface StandaloneGuard extends FunctionInjections {
  canPerform(context: ExecutionContext, ...injections: any[]): boolean | Promise<boolean> | any;
};

export interface ErrorHandler<T = any> {
  catch(error: T, context: ExecutionContext): any;
};

export interface StandaloneErrorHandler<T = any> extends FunctionInjections {
  catch(error: T, context: ExecutionContext, ...injections: any[]): any;
};

export interface PipeTransform<T = any, R = any> {
  transform(value: T, argMetadata: ArgumentMetadata, context: ExecutionContext): R | Promise<R>;
}

export interface StandalonePipeTransform<T = any, R = any> extends FunctionInjections {
  transform(value: T, argMetadata: ArgumentMetadata, context: ExecutionContext, ...injections: any[]): R | Promise<R>;
};

export interface ArgumentMetadata {
  readonly type?: string;
  readonly metatype?: Type<any> | undefined;
  readonly data?: any;
}

export interface ExtensionItem {
  item?: InjectionItem;
  func?: Function;
}
