import { wait, waitSequence } from '@adi/core';
import { injectableDefinitions } from '@adi/core/lib/injector';
import { getAllKeys } from '@adi/core/lib/utils';
import { ExecutionContext, executionContextFactory, retrieveExecutionContextArguments, isExecutionContextArgument } from './execution-context';
import { enhancersDefinitions } from './definition';
import { INTERCEPTORS, GUARDS, EXCEPTION_HANDLERS, PIPES } from './tokens';

import type { Injector, Session, ProviderDefinition, ProviderAnnotations, ProviderToken, ClassType } from "@adi/core";
import type { EnhancerItem, EnhancersDefinition, EnhancersDefinitionMethod, PipeTransform, Interceptor, Guard, ExceptionHandler, ArgumentMetadata, ExtractorFactory, EnhancerKind } from './interfaces';

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

  // applyResolvers(clazz, definition);
  const resolver = factory.resolver;
  factory.resolver = (injector: Injector, session: Session, data: any) => {
    return wait(
      resolver(injector, session, data),
      result => applyAllEnhancers(result, session, definition),
    )
  }
}

function updateDefinition(clazz: ClassType, definition: EnhancersDefinition) {
  const injectableDef = injectableDefinitions.get(clazz);
  let enhancerTokens = injectableDef.options.annotations.enhancerTokens;
  if (enhancerTokens) {
    Object.keys(enhancerTokens).forEach(token => {
      
    });
  }
}

// const globalResolvers: Record<EnhancerKind, EnhancerItem> = {
//   interceptor: { resolver: (session) =>  },
// }

// function applyResolvers(clazz: ClassType, definition: EnhancersDefinition) {
//   const injectableDef = injectableDefinitions.get(clazz);
//   let enhancerTokens = injectableDef.options.annotations.enhancerTokens;
//   definition;
// }

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
  return instance;
}

type NextEnhancer = (ctx: ExecutionContext) => unknown;

function applyPipes(enhancers: EnhancersDefinitionMethod['pipes'], next: NextEnhancer, session: Session) {
  return (ctx: ExecutionContext) => {
    const args = retrieveExecutionContextArguments(ctx);
    return waitSequence(
      enhancers,
      (singleEnhancers, index) => {
        if (singleEnhancers) {
          return wait(
            resolveEnhancers<PipeTransform>(singleEnhancers.enhancers, session),
            pipes => runPipes(pipes, ctx, singleEnhancers.metadata, singleEnhancers.extractor, args, index),
          );
        }
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
  return (ctx: ExecutionContext) => wait(
    resolveEnhancers<Interceptor>(enhancers, session),
    interceptors => runInterceptors(interceptors, ctx, () => next),
  );
}

function runInterceptors(interceptors: Array<Interceptor>, ctx: ExecutionContext, last: () => NextEnhancer) {
  const length = interceptors.length - 1;
  const nextInterceptor = (i: number) => {
    const next = i === length ? last : () => nextInterceptor(i+1);
    return interceptors[i].intercept(ctx, next);
  }
  return nextInterceptor(0);
}

function applyGuards(enhancers: Array<EnhancerItem>, next: NextEnhancer, session: Session) {
  return (ctx: ExecutionContext) => wait(
    resolveEnhancers<Guard>(enhancers, session),
    guards => runGuards(guards, 0, ctx, next),
  );
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
  return (ctx: ExecutionContext) => wait(
    resolveEnhancers<ExceptionHandler>(enhancers, session),
    handlers => runExceptionHandlers(handlers, ctx, next),
  );
}

function runExceptionHandlers(handlers: Array<ExceptionHandler>, ctx: ExecutionContext, next: NextEnhancer) {
  if (handlers.length === 0) {
    return;
  }
  
  return wait(
    next(ctx),
    undefined,
    (error: Error) => {
      const shifted = handlers.shift();
      // TODO: Maybe run all error handlers, not check if given error will throw error? use waitSequence()
      return runExceptionHandlers(handlers, ctx, () => shifted.catch(error, ctx));
    }
  );
}

function applyResultFunction(original: Function) {
  return (ctx: ExecutionContext) => {
    return original.apply(ctx.instance, retrieveExecutionContextArguments(ctx));
  }
}

function applyExecutionContext<T>(next: NextEnhancer, factory: ReturnType<typeof executionContextFactory>) {
  return function(...args: any[]) {
    const maybeArgument = args[0];
    if (isExecutionContextArgument(maybeArgument)) {
      const ctx = factory(maybeArgument.type, maybeArgument.data);
      return next(ctx);
    }

    const ctx = factory('adi:function-call', args);
    return next(ctx);
  }
}

function resolveEnhancers<T>(enhancers: Array<EnhancerItem>, session: Session): T[] {
  return waitSequence(
    enhancers,
    enhancer => enhancer.resolver(session),
  ) as T[];
}

type HasEnhancerTokens = {
  global: Record<EnhancerKind, boolean>;
  custom: Record<EnhancerKind, boolean>;
}

function hasTokens(tokens: ProviderAnnotations['enhancerTokens'] | undefined, injector: Injector): HasEnhancerTokens | false {
  const has = { has: false };
  const hasGlobal: Record<EnhancerKind, boolean> = {
    interceptor: findTokenInInjectors(INTERCEPTORS, injector, has),
    guard: findTokenInInjectors(GUARDS, injector, has),
    exceptionHandler: findTokenInInjectors(EXCEPTION_HANDLERS, injector, has),
    pipe: findTokenInInjectors(PIPES, injector, has),
  }

  let hasCustom: Record<EnhancerKind, boolean> = {} as any;
  if (tokens) {
    hasCustom = {
      interceptor: findTokenInInjectors(tokens.interceptor, injector, has),
      guard: findTokenInInjectors(tokens.guard, injector, has),
      exceptionHandler: findTokenInInjectors(tokens.exceptionHandler, injector, has),
      pipe: findTokenInInjectors(tokens.pipe, injector, has),
    }
  }

  if (has.has === false) {
    return false;
  }

  return {
    global: hasGlobal,
    custom: hasCustom,
  }
}

function findTokenInInjectors(token: ProviderToken, injector: Injector, has: { has: boolean }) {
  while (injector) {
    if (injector.providers.has(token)) {
      return has.has = true;
    }
    injector = injector.parent;
  }
  return false;
}
