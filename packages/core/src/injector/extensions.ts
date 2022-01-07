import { Injector } from './injector';
import { Session } from './session';
import { ExecutionContext } from './execution-context';
import { Type, ExtensionItem, OptimizedExtensionItem, PipeItem, InjectionMethod, ExecutionContextArgs, ArgumentMetadata } from "../interfaces";
import { thenable } from '../utils';
import { NOOP_FN } from '../constants';

// TODO: Create optimized function and save it to the cache and return for every that same DefinitionRecord (it can be retrieved from parentSession)
export function injectExtensions<T>(provider: Type<T>, instance: T, methodName: string, method: InjectionMethod, injector: Injector, parentSession: Session) {
  const eHandlers = method.eHandlers;
  const middlewares = method.middlewares;
  const guards = method.guards;
  const interceptors = method.interceptors;
  const pipes = method.pipes;
  
  const hasExtensions = interceptors.length || pipes.length || middlewares.length || eHandlers.length || guards.length;
  if (!hasExtensions) return;

  instance[methodName] = handlResult(instance[methodName]);
  if (pipes.length) {
    instance[methodName] = handlePipes(pipes, instance[methodName], injector, parentSession);
  }
  if (interceptors.length) {
    instance[methodName] = handleInterceptors(interceptors, instance[methodName], injector, parentSession);
  }
  if (guards.length) {
    instance[methodName] = handleGuards(guards, instance[methodName], injector, parentSession);
  }
  if (middlewares.length) {
    instance[methodName] = handleMiddlewares(middlewares, instance[methodName], injector, parentSession);
  }
  if (eHandlers.length) {
    instance[methodName] = handleErrorHandlers(eHandlers, instance[methodName], injector, parentSession);
  }
  instance[methodName] = handleExecutionContext(provider, method.handler, instance[methodName]);
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
) {
  const pipes = pipeItems.filter(Boolean).map(pipe => handlePipeItem(pipe, injector, parentSession));
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
) {
  const cached = prepareExtensions(pipe.pipes, 'transform', injector, parentSession);
  return (args: ExecutionContextArgs) => {
    return thenable(
      () => pipe.extractor(args.ctx),
      value => thenable(
        () => runPipes(cached, 0, value, pipe.metadata, args.ctx),
        result => args.args[pipe.metadata.index] = result,
      ),
    );
  }
}

function runPipes(
  pipes: OptimizedExtensionItem[],
  idx: number,
  value: unknown,
  metadata: ArgumentMetadata,
  ctx: ExecutionContext,
) {
  if (pipes.length === idx) return value;
  return thenable(
    () => pipes[idx].func(value, metadata, ctx),
    result => runPipes(pipes, ++idx, result, metadata, ctx),
  );
}

function handleInterceptors(
  interceptors: ExtensionItem[], 
  previousMethod: Function,
  injector: Injector, 
  parentSession: Session, 
) {
  const cached = prepareExtensions(interceptors, 'intercept', injector, parentSession);
  return (args: ExecutionContextArgs) => {
    return runInterceptors(cached, args.ctx, () => previousMethod(args));
  }
}

function runInterceptors(interceptors: OptimizedExtensionItem[], ctx: ExecutionContext, last: () => any) {
  const length = interceptors.length - 1;
  const nextInterceptor = (i: number) => {
    const next = i === length ? last : () => nextInterceptor(i+1);
    return interceptors[i].func(ctx, next);
  }
  return nextInterceptor(0);
}

function handleGuards(
  guards: ExtensionItem[], 
  previousMethod: Function,
  injector: Injector, 
  parentSession: Session, 
) {
  const cached = prepareExtensions(guards, 'canPerform', injector, parentSession);
  return (args: ExecutionContextArgs) => {
    return runGuards(cached, 0, args.ctx, () => previousMethod(args));
  }
}

function runGuards(guards: OptimizedExtensionItem[], idx: number, ctx: ExecutionContext, last: () => any) {
  if (guards.length === idx) return last();
  return thenable(
    () => guards[idx].func(ctx),
    result => {
      if (!result) return;
      return runGuards(guards, ++idx, ctx, last);
    }
  );
}

function handleMiddlewares(
  middlewares: ExtensionItem[], 
  previousMethod: Function,
  injector: Injector, 
  parentSession: Session, 
) {
  const cached = prepareExtensions(middlewares, 'use', injector, parentSession);
  return (args: ExecutionContextArgs) => {
    return thenable(
      () => runMiddlewares(cached, args.ctx),
      () => previousMethod(args),
    );
  }
}

function runMiddlewares(middlewares: OptimizedExtensionItem[], ctx: ExecutionContext) {
  const length = middlewares.length - 1;
  const nextMiddleware = (i: number) => {
    const next = i === length ? NOOP_FN : () => nextMiddleware(i+1);
    return middlewares[i].func(ctx, next);
  }
  return nextMiddleware(0);
}

function handleErrorHandlers(
  eHandlers: ExtensionItem[], 
  previousMethod: Function,
  injector: Injector, 
  parentSession: Session, 
) {
  const cached = prepareExtensions(eHandlers, 'catch', injector, parentSession);
  return (args: ExecutionContextArgs) => {
    return runErrorHandlers([...cached], args.ctx, () => previousMethod(args));
  }
}

function runErrorHandlers(eHandlers: OptimizedExtensionItem[], ctx: ExecutionContext, callback: () => any) {
  if (eHandlers.length === 0) return;
  return thenable(
    callback,
    result => result,
    error => {
      const shifted = eHandlers.shift();
      return runErrorHandlers(eHandlers, ctx, () => shifted.func(error, ctx));
    }
  );
}

function handleExecutionContext<T>(provider: Type, handler: Function, previousMethod: Function) {
  return function(this: T, ...args: any[]) {
    const ctx = ExecutionContext.tryFromHost(args, provider, handler);
    const newArgs: ExecutionContextArgs<T> = { _this: this, args: [...ctx.getArgs()], ctx };
    return previousMethod(newArgs);
  }
}

function prepareExtensions(extensions: ExtensionItem[], methodName: string, injector: Injector, parentSession: Session): Array<OptimizedExtensionItem> {  
  const args: Array<OptimizedExtensionItem> = [];
  for (let i = 0, l = extensions.length; i < l; i++) {
    const ext = extensions[i];
    const arg = ext.arg;
    let func: (...args: any[]) => unknown;
    if (ext.type === 'inj') {
      let cached: any;
      func = (...args: any[]) => {
        if (cached) return cached[methodName](...args);
        return thenable(
          () => {
            const argSession = Session.create(arg.token, arg.metadata, parentSession);
            return injector.resolveToken(arg.wrapper, argSession);
          },
          value => (cached = value)[methodName](...args),
        );
      }
    } else if (ext.type === 'func') {

    } else {
      func = (...args: any[]) => arg[methodName](...args);
    }
    args.push({ func });
  };
  return args;
}
