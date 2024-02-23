import { wait, waitAll } from "@adi/core";
import { InjectionKind } from "@adi/core/lib/enums";
import { createInjectionMetadata } from '@adi/core/lib/injector';
import { getAllKeys } from "@adi/core/lib/utils";

import { enhancersDefinitions, globalEnhancerResolvers } from "./enhancers";
import { originalMethodMetaKey, enhancersAppliedMetaKey } from './constants';
import { ExecutionContext } from "./execution-context";
import { runEnhancers, runExceptionHandlers, runGuards, runInterceptors, runPipes } from "./run";

import type { ClassType, InjectionMetadata, ProviderDefinition, Session } from "@adi/core";
import type { Guard, Interceptor, PipeTransform, ExceptionHandler, EnhancersDefinition, PipeExtractor, NextEnhancer } from "./types";

export type RegistryItemEnhancers = {
  guards: Guard[];
  interceptors: Interceptor[];
  pipes: Array<{
    extractor: PipeExtractor;
    pipes: PipeTransform[];
  } | undefined>
  exceptionHandlers: ExceptionHandler[];
  start: NextEnhancer;
}

type RegistryItem = {
  instance: any;
  enhancers: Record<string | symbol, RegistryItemEnhancers>;
}

const ctxRegistry = new WeakMap<object, RegistryItem>()

export function injectEnhancers(provDefinition: ProviderDefinition): void {
  const factory = provDefinition.factory;
  const clazz = factory?.data?.class;
  if (!clazz) {
    return;
  }

  const definition = enhancersDefinitions.get(clazz);
  if (!definition) {
    return;
  }

  const originalResolver = factory.resolver;
  factory.resolver = (injector, session, data) => {
    return wait(
      originalResolver(injector, session, data),
      instance => resolveEnhancers(definition, instance, session),
    )
  }
}

export function resolveEnhancers(definition: EnhancersDefinition, instance: any, session: Session): void {
  const { methods, class: clazz } = definition;

  const registryItem: RegistryItem = {
    instance,
    enhancers: {},
  }
  ctxRegistry.set(instance, registryItem)

  const globalInjections: Array<Promise<void> | void> = [];
  getAllKeys(methods).map(method => {
    const injections: Array<Promise<any> | any> = [];
    const enhancers: RegistryItemEnhancers = registryItem.enhancers[method] = {
      guards: [],
      interceptors: [],
      pipes: [],
      exceptionHandlers: [],
      start: () => {},
    };

    // resolve global enhancers
    injections.push(
      wait(globalEnhancerResolvers.guards(session), result => result && enhancers.guards.push(...result as Guard[])),
      wait(globalEnhancerResolvers.interceptors(session), result => result && enhancers.interceptors.push(...result as Interceptor[])),
      wait(globalEnhancerResolvers.exceptionHandlers(session), result => result && enhancers.exceptionHandlers.push(...result as ExceptionHandler[])),
    )

    // resolve class enhancers
    clazz.guards.forEach(resolver => injections.push(wait(resolver(session), result => result && enhancers.guards.push(result as Guard))))
    clazz.interceptors.forEach(resolver => injections.push(wait(resolver(session), result => result && enhancers.interceptors.push(result as Interceptor))))
    clazz.exceptionHandlers.forEach(resolver => injections.push(wait(resolver(session), result => result && enhancers.exceptionHandlers.push(result as ExceptionHandler))))
    
    // resolve method enhancers
    const { guards, interceptors, pipes, extractors, exceptionHandlers } = methods[method];
    guards.forEach(resolver => injections.push(wait(resolver(session), result => result && enhancers.guards.push(result as Guard))))
    interceptors.forEach(resolver => injections.push(wait(resolver(session), result => result && enhancers.interceptors.push(result as Interceptor))))
    exceptionHandlers.forEach(resolver => injections.push(wait(resolver(session), result => result && enhancers.exceptionHandlers.push(result as ExceptionHandler))))

    // resolve pipess
    extractors.map((extractor, index) => {
      if (extractor === undefined) {
        return;
      }

      const extractorPipes: PipeTransform[] = [];
      const extractorCtx = enhancers.pipes[index] = { extractor: undefined as any, pipes: extractorPipes, }

      // resolve extractor
      injections.push(wait(extractor.extractor(session), result => extractorCtx.extractor = result))
      // resolve global pipes
      injections.push(wait(globalEnhancerResolvers.pipes(session), result => result && extractorPipes.push(...result as PipeTransform[])))
      // resolve class pipes
      clazz.pipes.forEach(resolver => injections.push(wait(resolver(session), result => result && extractorPipes.push(result as PipeTransform))))
      // resolve method pipes
      pipes.forEach(resolver => injections.push(wait(resolver(session), result => result && extractorPipes.push(result as PipeTransform))))
      // resolve parameter pipes
      extractor.pipes.forEach(resolver => injections.push(wait(resolver(session), result => result && extractorPipes.push(result as PipeTransform))))
    })

    globalInjections.push(waitAll(injections));
  })

  return waitAll(
    globalInjections,
    () => instance,
  );
}

export function patchEnhancerMethod(target: ClassType, methodName: string | symbol) {
  const proto = target.prototype;
  const originalMethod = proto[methodName]
  if (originalMethod[enhancersAppliedMetaKey]) {
    return originalMethod;
  }

  const descriptor = Object.getOwnPropertyDescriptor(proto, methodName)
  const metadata: InjectionMetadata = createInjectionMetadata({
    kind: InjectionKind.CUSTOM,
    target,
    key: methodName,
    descriptor,
  });

  function enhancers(this: object, ...args: any[]) {
    const ctx = ctxRegistry.get(this) as RegistryItem;
    const enhancers = ctx.enhancers[methodName];
    const execCtx = ExecutionContext.create('adi:function-call', args, this, {} as any)

    return wait(
      runEnhancers(enhancers, execCtx),
      () => originalMethod.apply(this, args)
    )
  }

  Object.defineProperty(enhancers, 'name', { value: methodName });
  enhancers[originalMethodMetaKey] = originalMethod;
  enhancers[enhancersAppliedMetaKey] = true;
  return proto[methodName] = enhancers;
}
