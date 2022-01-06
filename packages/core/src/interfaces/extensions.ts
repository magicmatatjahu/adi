import { ExecutionContext } from '../injector/execution-context';
import { InjectionArgument, FunctionInjections } from './injection.interface';
import { Type } from './type.interface';

export interface Interceptor<R = any> {
  intercept(context: ExecutionContext, next: NextInterceptor<R>): R | Promise<R>;
};

export interface StandaloneInterceptor<R = any> extends FunctionInjections {
  intercept(context: ExecutionContext, next: NextInterceptor, ...injections: any[]): R | Promise<R>;
};

export interface NextInterceptor<R = any> {
  (): R | Promise<R>;
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

export interface PipeDecorator<Data = unknown> {
  (data: Data): ParameterDecorator;
  decorators?: ParameterDecorator[];
}
export type PipeFactory<Data = unknown, Result = unknown> = (metadata: ArgumentMetadata<Data>, context: ExecutionContext) => Result;

export interface ArgumentMetadata<Data = unknown> {
  readonly type: string;
  readonly metatype: Type<any> | undefined;
  readonly index: number; 
  readonly data: Data;
}

export interface PipeItem<Data = unknown> {
  decorator: (ctx: ExecutionContext) => unknown;
  metadata: ArgumentMetadata<Data>
  pipes: ExtensionItem[];
}

export interface ExtensionItem {
  arg?: InjectionArgument;
  func?: Function;
}

export interface ExecutionContextArgs<T = unknown> {
  _this: T;
  ctx?: ExecutionContext;
  args?: any[];
}
