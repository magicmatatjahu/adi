import { wait, waitCallback, waitSequence } from "@adi/core";
import { noopThen } from "@adi/core/lib/utils/wait";

import type { RegistryItemEnhancers } from './apply';
import type { ExecutionContext } from "./execution-context";
import type { EnhancersExtractors, Interceptor, Guard, ExceptionHandler, PipeTransform, NextEnhancer, ArgumentMetadata } from "./types";

export function runEnhancers(enhancers: RegistryItemEnhancers, ctx: ExecutionContext) {
  const { exceptionHandlers, guards, interceptors, pipes } = enhancers;
  return runExceptionHandlers(
    exceptionHandlers, 
    ctx, 
    () => runGuards(guards, ctx, -1, () => runInterceptors(interceptors, ctx, () => runPipes(pipes, ctx)))
  );
}

export function runInterceptors(interceptors: Array<Interceptor>, ctx: ExecutionContext, next: () => NextEnhancer) {
  interceptors = [...interceptors, { intercept: next }]
  return optimizedRunInterceptors(interceptors, ctx, -1);
}

function optimizedRunInterceptors(interceptors: Array<Interceptor>, ctx: ExecutionContext, index: number) {
  const current = interceptors[++index];
  return current.intercept(ctx, () => optimizedRunInterceptors(interceptors, ctx, index));
}

export function runGuards(guards: Array<Guard>, ctx: ExecutionContext, idx: number, next: NextEnhancer) {
  if (guards.length === idx) {
    return next(ctx);
  }

  return wait(
    guards[idx].canPerform(ctx),
    result => {
      if (!result) return;
      return runGuards(guards, ctx, ++idx, next);
    }
  );
}

function noop() {}
export function runExceptionHandlers(handlers: Array<ExceptionHandler>, ctx: ExecutionContext, next: NextEnhancer) {
  return waitCallback(
    () => next(ctx),
    noopThen,
    error => runExceptionHandlers(
      [...handlers, { catch: noop }], ctx, () => handleExceptionHandlers(error, handlers, ctx, -1),
    ),
  );
}

function handleExceptionHandlers(error: unknown, handlers: Array<ExceptionHandler>, ctx: ExecutionContext, index: number) {
  const current = handlers[++index];
  return current.catch(error, ctx, () => handleExceptionHandlers(error, handlers, ctx, index));
}

export function runPipes(extractors: EnhancersExtractors[], ctx: ExecutionContext) {
  return wait(
    extractor(argument, ctx),
    value => {
      let current = value;
      return waitSequence(
        pipes,
        pipe => wait(
          pipe.transform(current, argument, ctx),
          acc => (current = acc),
        ),
        () => args[index] = current,
      )
    }
  );
}

export function runArgumentPipes(pipes: PipeTransform[], argument: ArgumentMetadata, ctx: ExecutionContext) {
  return wait(
    extractor(argument, ctx),
    value => {
      let current = value;
      return waitSequence(
        pipes,
        pipe => wait(
          pipe.transform(current, argument, ctx),
          acc => (current = acc),
        ),
        () => args[index] = current,
      )
    }
  );
}