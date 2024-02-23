import { wait, waitCallback, waitSequence } from '@adi/core';
import { injectableDefinitions } from '@adi/core/lib/injector';
import { getAllKeys, noopThen } from '@adi/core/lib/utils';
import { ExecutionContext, executionContextFactory, retrieveExecutionContextArguments, setExecutionContextArguments, isExecutionContextArgument } from './execution-context';
import { enhancersDefinitions, addEnhancersByToken } from './definition';
import { INTERCEPTORS, GUARDS, EXCEPTION_HANDLERS, PIPES } from './tokens';

import type { Injector, Session, ProviderDefinition, ProviderAnnotations } from "@adi/core";
import type { EnhancerItem, EnhancersDefinition, EnhancersDefinitionMethod, PipeTransform, Interceptor, Guard, ExceptionHandler, ArgumentMetadata, ExtractorFactory } from './interfaces';

export function injectEnhancers(provDefinition: ProviderDefinition) {
  const factory = provDefinition.factory;
  const clazz = factory?.data?.class;
  if (!clazz) {
    return;
  }

  const definition = enhancersDefinitions.get(clazz);
  if (!definition) {
    return;
  }

  const injectableDef = injectableDefinitions.get(clazz);
  const enhancers = injectableDef?.options?.annotations?.enhancers;

  applyGlobalEnhancers(definition, enhancers);
  const originalResolver = factory.resolver;
  factory.resolver = (injector: Injector, session: Session, data: any) => {
    return wait(
      originalResolver(injector, session, data),
      result => applyAllEnhancers(result, session, definition),
    )
  }
}

function applyGlobalEnhancers(definition: EnhancersDefinition, enhancers?: ProviderAnnotations['enhancers']) {
  if (enhancers && enhancers.tokens) {
    const tokens = enhancers.tokens;
    tokens.interceptor && addEnhancersByToken([tokens.interceptor], 'interceptor', definition);
    tokens.guard && addEnhancersByToken([tokens.guard], 'guard', definition);
    tokens.exceptionHandler && addEnhancersByToken([tokens.exceptionHandler], 'exceptionHandler', definition);
    tokens.pipe && addEnhancersByToken([tokens.pipe], 'pipe', definition);
  }

  addEnhancersByToken([INTERCEPTORS], 'interceptor', definition);
  addEnhancersByToken([GUARDS], 'guard', definition);
  addEnhancersByToken([EXCEPTION_HANDLERS], 'exceptionHandler', definition);
  addEnhancersByToken([PIPES], 'pipe', definition);
}

function applyAllEnhancers<T>(instance: T, session: Session, definition: EnhancersDefinition): T {
  const methods = definition.methods;
  getAllKeys(methods).forEach(methodName => applyEnhancers(instance, methodName, methods[methodName], session, definition));
  return instance;
}

function applyEnhancers(instance: any, methodName: string | symbol, enhancers: EnhancersDefinitionMethod, session: Session, definition: EnhancersDefinition) {
  let { exceptionHandlers, guards, interceptors, pipes } = enhancers;

  instance[methodName] = applyResultFunction(instance[methodName]);
  if (pipes.length) {
    instance[methodName] = applyPipes(pipes, instance[methodName], session);
  }
  if (interceptors.length) {
    instance[methodName] = applyInterceptors(interceptors, instance[methodName], session);
  }
  if (guards.length) {
    instance[methodName] = applyGuards(guards, instance[methodName], session);
  }
  if (exceptionHandlers.length) {
    instance[methodName] = applyExceptionHandlers(exceptionHandlers, instance[methodName], session);
  }

  const factory = executionContextFactory(instance, enhancers.ctxMetadata);
  instance[methodName] = applyExecutionContext(instance[methodName], factory);
}

type NextEnhancer = (ctx: ExecutionContext) => unknown;

// TODO: Resolve in pararell - create new waitAllSequence await hook
function applyPipes(enhancers: EnhancersDefinitionMethod['pipes'], next: NextEnhancer, session: Session) {
  let instances: PipeTransform[][] = [];
  return (ctx: ExecutionContext) => {
    const args = retrieveExecutionContextArguments(ctx);
    return waitSequence(
      enhancers,
      (single, index) => {
        if (instances[index]) {
          return runPipes(instances[index], ctx, single.metadata, single.extractor, args, index);
        }

        if (!single) {
          return;
        }
        
        return wait(
          resolveEnhancers<PipeTransform>(single.enhancers, session),
          pipes => runPipes((instances[index] = pipes), ctx, single.metadata, single.extractor, args, index),
        );
      },
      () => next(ctx),
    )
  }
}

function runPipes(pipes: PipeTransform[], ctx: ExecutionContext, argument: ArgumentMetadata, extractor: ExtractorFactory, args: any[], index: number) {
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

function applyInterceptors(enhancers: Array<EnhancerItem>, next: NextEnhancer, session: Session) {
  let instances: Interceptor[];
  return (ctx: ExecutionContext) => {
    if (instances) {
      return runInterceptors(instances, ctx, () => next(ctx) as any);
    }

    return wait(
      resolveEnhancers<Interceptor>(enhancers, session),
      interceptors => runInterceptors((instances = interceptors), ctx, () => next(ctx) as any),
    )
  };
}

function runInterceptors(interceptors: Array<Interceptor>, ctx: ExecutionContext, last: () => NextEnhancer) {
  if (interceptors.length) {
    const length = interceptors.length - 1;
    const nextInterceptor = (i: number) => {
      const next = i === length ? last : () => nextInterceptor(i+1);
      return interceptors[i].intercept(ctx, next);
    }
    return nextInterceptor(0);
  }
  return last();
}

function applyGuards(enhancers: Array<EnhancerItem>, next: NextEnhancer, session: Session) {
  let instances: Guard[];
  return (ctx: ExecutionContext) => {
    if (instances) {
      return runGuards(instances, 0, ctx, next);
    }

    return wait(
      resolveEnhancers<Guard>(enhancers, session),
      guards => runGuards((instances = guards), 0, ctx, next),
    )
  };
}

function runGuards(guards: Array<Guard>, idx: number, ctx: ExecutionContext, next: NextEnhancer) {
  if (guards.length === idx) {
    return next(ctx);
  }

  return wait(
    guards[idx].canPerform(ctx),
    result => {
      if (!result) return;
      return runGuards(guards, ++idx, ctx, next);
    }
  );
}

function applyExceptionHandlers(enhancers: Array<EnhancerItem>, next: NextEnhancer, session: Session) {
  let instances: ExceptionHandler[];
  return (ctx: ExecutionContext) => {
    if (instances) {
      return runExceptionHandlers(instances, ctx, next)
    }

    return wait(
      resolveEnhancers<ExceptionHandler>(enhancers, session),
      handlers => runExceptionHandlers((instances = handlers), ctx, next),
    )
  };
}

function runExceptionHandlers(handlers: Array<ExceptionHandler>, ctx: ExecutionContext, next: NextEnhancer) {
  return waitCallback(
    () => next(ctx),
    noopThen,
    error => runExceptionHandlers(
      handlers, ctx, () => handleExceptionHandlers(error, handlers, ctx),
    ),
  );
}

const noop = () => {};
function handleExceptionHandlers(error: unknown, handlers: Array<ExceptionHandler>, ctx: ExecutionContext) {
  if (handlers.length) {
    const length = handlers.length - 1;
    const nextHandler = (i: number) => {
      const next = i === length ? noop : () => nextHandler(i+1);
      return handlers[i].catch(error, ctx, next);
    }
    return nextHandler(0);
  }
}

function applyResultFunction(original: Function) {
  return (ctx: ExecutionContext) => {
    return original.apply(ctx.instance, retrieveExecutionContextArguments(ctx));
  }
}

function applyExecutionContext(next: NextEnhancer, factory: ReturnType<typeof executionContextFactory>) {
  return function(...args: any[]) {
    const maybeArgument = args[0];
    if (isExecutionContextArgument(maybeArgument)) {
      const ctx = factory(maybeArgument.type, maybeArgument.data);
      return next(ctx);
    }

    const ctx = factory('adi:function-call', args);
    setExecutionContextArguments(ctx, args);
    return next(ctx);
  }
}

// TODO: Resolve in pararell - create new waitAllSequence await hook
function resolveEnhancers<T>(enhancers: Array<EnhancerItem>, session: Session): T[] | Promise<T[]> {
  return waitSequence(
    enhancers,
    enhancer => enhancer.resolver(session) as T,
    flatAndFilter,
  )
}

function flatAndFilter(value: Array<any | any[]>): any[] {
  const flatted: any[] = [];
  value.forEach(v => {
    if (Array.isArray(v)) {
      flatted.push(...v)
    } else {
      flatted.push(v);
    }
  });
  return flatted.filter(Boolean);
}