import { Injector } from './injector';
import { Session } from './session';
import { createExecutionContext, ExecutionContext } from './execution-context';
import { Type, ExtensionItem, PipeItem, InjectionMethod, ExecutionContextArgs, Interceptor, Guard, ErrorHandler, PipeTransform, ArgumentMetadata } from "../interfaces";
import { SessionStatus } from '../enums';
import { thenable } from '../utils';

export function injectExtensions<T>(provider: Type<T>, instance: T, methodName: string, method: InjectionMethod, injector: Injector, parentSession: Session) {
  const guards = method.guards;
  const interceptors = method.interceptors;
  const pipes = method.pipes;
  const eHandlers = method.eHandlers;
  
  const hasExtensions = interceptors.length || pipes.length || eHandlers.length || guards.length;
  if (!hasExtensions) return;
  const isAsync = (parentSession.status & SessionStatus.ASYNC) > 0;

  instance[methodName] = handlResult(instance[methodName]);
  if (pipes.length) {
    instance[methodName] = handlePipes(pipes, instance[methodName], injector, parentSession, isAsync);
  }
  if (interceptors.length) {
    instance[methodName] = handleInterceptors(interceptors, instance[methodName], injector, parentSession, isAsync);
  }
  if (guards.length) {
    instance[methodName] = handleGuards(guards, instance[methodName], injector, parentSession, isAsync);
  }
  if (eHandlers.length) {
    instance[methodName] = handleErrorHandlers(eHandlers, instance[methodName], injector, parentSession, isAsync);
  }
  instance[methodName] = handleExecutionContext(provider, instance, method.handler, instance[methodName]);
}

function handlResult(previousMethod: Function) {
  return (args: ExecutionContextArgs) => {
    return previousMethod.apply(args._this, args.args);
  }
}

function handlePipes(
  pipeItems: PipeItem[], 
  previousMethod: Function,
  injector: Injector, 
  parentSession: Session, 
  isAsync: boolean,
) {
  const pipes = pipeItems.filter(Boolean).map(pipe => handlePipeItem(pipe, injector, parentSession, isAsync));
  return (args: ExecutionContextArgs) => {
    return runPipeItems(pipes, 0, args, previousMethod);
  }
}

function runPipeItems(
  pipes: Array<(args: ExecutionContextArgs) => unknown>, 
  idx: number, 
  args: ExecutionContextArgs,
  previousMethod: Function,
) {
  if (pipes.length === idx) return previousMethod(args);
  return thenable(
    () => pipes[idx](args),
    () => runPipeItems(pipes, ++idx, args, previousMethod),
  );
}

function handlePipeItem(
  pipe: PipeItem,
  injector: Injector, 
  parentSession: Session, 
  isAsync: boolean,
) {
  let cached: any[] | Promise<any[]> = pipe.pipes.length ? undefined : [];
  return (args: ExecutionContextArgs) => {
    cached = cached || (cached = injectExtensionItems(pipe.pipes, injector, parentSession, isAsync));
    return thenable(
      () => pipe.decorator(args.ctx),
      value => thenable(
        () => runPipes(cached as any, 0, value, pipe.metadata, args.ctx),
        result => args.args[pipe.metadata.index] = result,
      ),
    );
  }
}

function runPipes(
  pipes: PipeTransform[], 
  idx: number, 
  value: unknown,
  metadata: ArgumentMetadata,
  ctx: ExecutionContext, 
) {
  if (pipes.length === idx) return value;
  return thenable(
    () => pipes[idx].transform(value, metadata, ctx),
    result => runPipes(pipes, ++idx, result, metadata, ctx),
  );
}

function handleInterceptors(
  interceptors: ExtensionItem[], 
  previousMethod: Function,
  injector: Injector, 
  parentSession: Session, 
  isAsync: boolean,
) {
  let cached: any[] | Promise<any[]>;
  return (args: ExecutionContextArgs) => {
    cached = cached || (cached = injectExtensionItems(interceptors, injector, parentSession, isAsync));
    return runInterceptors(cached as Interceptor[], args.ctx, () => previousMethod(args));
  }
}

function runInterceptors(interceptors: Interceptor[], ctx: ExecutionContext, last: () => any) {
  const length = interceptors.length - 1;
  const nextInterceptor = (i: number) => () => {
    const next = i === length ? last : () => nextInterceptor(i+1)();
    return interceptors[i].intercept(ctx, next);
  }
  return nextInterceptor(0)();
}

function handleGuards(
  guards: ExtensionItem[], 
  previousMethod: Function,
  injector: Injector, 
  parentSession: Session, 
  isAsync: boolean,
) {
  let cached: any[] | Promise<any[]>;
  return (args: ExecutionContextArgs) => {
    cached = cached || (cached = injectExtensionItems(guards, injector, parentSession, isAsync));
    return runGuards(cached as Guard[], 0, args.ctx, () => previousMethod(args));
  }
}

function runGuards(guards: Guard[], idx: number, ctx: ExecutionContext, last: () => any) {
  if (guards.length === idx) return last();
  return thenable(
    () => guards[idx].canPerform(ctx),
    result => {
      if (!result) return;
      return runGuards(guards, idx++, ctx, last);
    }
  );
}

function handleErrorHandlers(
  eHandlers: ExtensionItem[], 
  previousMethod: Function,
  injector: Injector, 
  parentSession: Session, 
  isAsync: boolean,
) {
  let cached: any[] | Promise<any[]>;
  return (args: ExecutionContextArgs) => {
    cached = cached || (cached = injectExtensionItems(eHandlers, injector, parentSession, isAsync));
    return runErrorHandlers(cached as ErrorHandler[], args.ctx, () => previousMethod(args));
  }
}

function runErrorHandlers(eHandlers: ErrorHandler[], ctx: ExecutionContext, callback: () => any) {
  return thenable(
    callback,
    undefined,
    error => {
      return eHandlers[0].catch(error, ctx);
    }
  );
}

function handleExecutionContext<T>(provider: Type, instance: T, handler: Function, previousMethod: Function) {
  return function(this: T, ...args: any[]) {
    const executionContext = createExecutionContext('default', args, provider, instance, handler);
    const newArgs: ExecutionContextArgs<T> = { _this: this, args: [...args], ctx: executionContext };
    return previousMethod(newArgs);
  }
}

function injectExtensionItems(extensions: ExtensionItem[], injector: Injector, parentSession: Session, isAsync: boolean) {  
  const args: Array<any> = [];
  for (let i = 0, l = extensions.length; i < l; i++) {
    const ext = extensions[i];
    if (ext.arg) {
      const arg = ext.arg;
      const argSession = Session.create(arg.token, arg.metadata, parentSession);
      args.push(injector.resolveToken(arg.wrapper, argSession));
    }
  };
  return isAsync ? Promise.all(args) : args;
}
