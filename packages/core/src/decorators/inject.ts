import { injectableDefinitions } from '../injector/injectable';
import { parseInjectArguments, createInjectionArgument } from '../injector/metadata';
import { InjectionKind } from '../enums';
import { getDecoratorContext, Reflection } from '../utils';

import type { ProviderToken, InjectionHook, InjectionAnnotations, InjectionArguments, InjectionArgument, ClassType, AbstractClassType, InjectionMetadata, DecoratorContext, ParsedInjectionItem, InferredInjectFunctionResult } from '../types';

export function Inject<T>(token: ProviderToken<T>);
export function Inject<T, A>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>);
export function Inject<T, A, B>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>);
export function Inject<T, A, B, C>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>);
export function Inject<T, A, B, C, D>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>);
export function Inject<T, A, B, C, D, E>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>);
export function Inject<T, A, B, C, D, E, F>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>);
export function Inject<T, A, B, C, D, E, F, G>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>);
export function Inject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>);
export function Inject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]);
export function Inject<T>(token: ProviderToken<T>, ...hooks: InjectionHook[]);

export function Inject<T>(token: ProviderToken<T>, annotations: InjectionAnnotations);
export function Inject<T, A>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>)
export function Inject<T, A, B>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>);
export function Inject<T, A, B, C>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>);
export function Inject<T, A, B, C, D>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>);
export function Inject<T, A, B, C, D, E>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>);
export function Inject<T, A, B, C, D, E, F>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>);
export function Inject<T, A, B, C, D, E, F, G>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>);
export function Inject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>);
export function Inject<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]);
export function Inject<T>(token: ProviderToken<T>, annotations: InjectionAnnotations, ...hooks: InjectionHook[]);

export function Inject<A>(hook1: InjectionHook<unknown, A>);
export function Inject<A, B>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>);
export function Inject<A, B, C>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>);
export function Inject<A, B, C, D>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>);
export function Inject<A, B, C, D, E>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>);
export function Inject<A, B, C, D, E, F>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>);
export function Inject<A, B, C, D, E, F, G>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>);
export function Inject<A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>);
export function Inject<A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]);
export function Inject(...hooks: InjectionHook[]);

export function Inject<T>(token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, ...hooks: InjectionHook[]) {
  const injectArgument = parseInjectArguments(token, annotations, hooks);
  return function(target: Object, key?: string | symbol, indexOrDescriptor?: number | PropertyDescriptor) {
    const ctx = getDecoratorContext(target, key, indexOrDescriptor);
    applyInject(ctx, injectArgument);
  }
}

export function applyInject(ctx: DecoratorContext, { token, annotations, hooks }: ParsedInjectionItem) {
  const target = ctx.class;
  const injections = injectableDefinitions.ensure(target).injections;

  const key = (ctx as { key: string | symbol }).key;
  const index = (ctx as { index: number }).index;
  const descriptor = (ctx as { descriptor: PropertyDescriptor }).descriptor;
  const isStatic = (ctx as { static: boolean }).static || false;
  const targetObject = isStatic ? target : target.prototype;
  const argument = createInjectionArgument(token as ProviderToken, annotations, hooks, {
    kind: InjectionKind.UNKNOWN,
    target,
    annotations,
    key,
    index,
    descriptor,
    static: isStatic
  });

  const metadata = argument.metadata;
  const kind = ctx.kind;
  switch (kind) {
    case 'parameter': {
      if (descriptor) { // method injection
        metadata.kind = InjectionKind.METHOD
        if (typeof argument.token === 'undefined') {
          argument.token = (Reflection.getOwnMetadata("design:paramtypes", targetObject, key) || [])[index];
        }
        const properInjections = getProperInjections(isStatic, injections);
        const parameters = properInjections.methods[key] || (properInjections.methods[key] = []);
        parameters[index] = argument; 
      } else { // constructor injection
        metadata.kind = InjectionKind.PARAMETER;
        if (typeof argument.token === 'undefined') {
          argument.token = (Reflection.getOwnMetadata("design:paramtypes", target) || [])[index];
        }
        injections.parameters[index] = argument;
      }

      break;
    };
    case 'property':
    case 'accessor': {
      argument.token = argument.token || Reflection.getOwnMetadata("design:type", targetObject, key);
      argument.metadata.kind = kind === 'property' ? InjectionKind.PROPERTY : InjectionKind.ACCESSOR;
      getProperInjections(isStatic, injections).properties[key] = argument;
      break;
    };
    case 'method': {
      const reflectedParameters = Reflection.getOwnMetadata("design:paramtypes", targetObject, key) || [];
      const properInjections = getProperInjections(isStatic, injections);
      const parameters = properInjections.methods[key] || (properInjections.methods[key] = []);
      mergeMethodParameters(parameters, reflectedParameters, annotations, hooks, argument.metadata);
      break;
    }
    default: throw new Error('@Inject decorator can be only used on parameter (constructor or method)/property/accessos/method level.');
  }
}

function getProperInjections(isStatic: boolean, injections: InjectionArguments): InjectionArguments {
  return isStatic ? (injections.static || (injections.static = { properties: {}, methods: {} })) as InjectionArguments : injections;
}

function mergeMethodParameters(injectionParameters: Array<InjectionArgument | undefined> = [], reflectedParameters: Array<ClassType | AbstractClassType>, annotations: InjectionAnnotations, hooks: Array<InjectionHook>, metadata: InjectionMetadata) {
  const updateExisting = Boolean(hooks || annotations); 
  reflectedParameters.forEach((reflectedParameter, index) => {
    if (!injectionParameters[index]) {
      injectionParameters[index] = createInjectionArgument(reflectedParameter, { ...metadata, kind: InjectionKind.PARAMETER, annotations: { ...annotations } }, hooks);
    } else if (updateExisting) {
      const parameter = injectionParameters[index];
      if (parameter) {
        parameter.hooks = [...hooks, ...parameter.hooks];
        parameter.metadata.annotations = { ...annotations, ...parameter.metadata.annotations };
      }
    }
  });
}
