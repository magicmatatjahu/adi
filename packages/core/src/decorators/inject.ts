import { injectableDefinitions } from '../injector/injectable';
import { parseInjectArguments, createInjectionArgument } from '../injector/metadata';
import { InjectionKind } from '../enums';
import { getDecoratorContext, Reflection } from '../utils';

import type { ProviderToken, InjectionHook, InjectionAnnotations, PlainInjectionItem, InjectionArguments, InjectionArgument, ClassType, AbstractClassType, InjectionMetadata, DecoratorContext } from '../types';

export function Inject<T = any>(token: ProviderToken<T>): ParameterDecorator | PropertyDecorator;
export function Inject<T = any>(annotations: InjectionAnnotations): ParameterDecorator | PropertyDecorator;
export function Inject<T = any>(...hooks: Array<InjectionHook>): ParameterDecorator | PropertyDecorator;
export function Inject<T = any>(token: ProviderToken<T>, annotations: InjectionAnnotations): ParameterDecorator | PropertyDecorator;
export function Inject<T = any>(token: ProviderToken<T>, ...hooks: Array<InjectionHook>): ParameterDecorator | PropertyDecorator;
export function Inject<T = any>(annotations: InjectionAnnotations, ...hooks: Array<InjectionHook>): ParameterDecorator | PropertyDecorator;
export function Inject<T = any>(token: ProviderToken<T>, annotations: InjectionAnnotations, ...hooks: Array<InjectionHook>): ParameterDecorator | PropertyDecorator;
export function Inject<T = any>(token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, ...hooks: Array<InjectionHook>): ParameterDecorator | PropertyDecorator {
  const injectArgument = parseInjectArguments(token, annotations, hooks);
  return function(target: Object, key: string | symbol, indexOrDescriptor?: number | PropertyDescriptor) {
    const ctx = getDecoratorContext(target, key, indexOrDescriptor);
    applyInject(ctx, injectArgument);
  }
}

export function applyInject(ctx: DecoratorContext, { token, annotations, hooks }: PlainInjectionItem) {
  const target = ctx.class;
  const injections = injectableDefinitions.ensure(target).injections;

  const key = (ctx as { key: string | symbol }).key;
  const index = (ctx as { index: number }).index;
  const descriptor = (ctx as { descriptor: PropertyDescriptor }).descriptor;
  const isStatic = (ctx as { static: boolean }).static || false;
  const targetObject = isStatic ? target : target.prototype;
  const argument = createInjectionArgument(token as ProviderToken, {
    kind: InjectionKind.UNKNOWN,
    target,
    annotations,
    key,
    index,
    descriptor,
    static: isStatic
  }, hooks);

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
      mergeMethodParameters(parameters, reflectedParameters, hooks, annotations, argument.metadata);
      break;
    }
    default: throw new Error('@Inject decorator can be only used on parameter (constructor or method)/property/accessos/method level.');
  }
}

function getProperInjections(isStatic: boolean, injections: InjectionArguments): InjectionArguments {
  return isStatic ? (injections.static || (injections.static = { properties: {}, methods: {} })) as InjectionArguments : injections;
}

function mergeMethodParameters(injectionParameters: Array<InjectionArgument | undefined> = [], reflectedParameters: Array<ClassType | AbstractClassType>, hooks: Array<InjectionHook>, annotations: InjectionAnnotations, metadata: InjectionMetadata) {
  const updateExisting = hooks || annotations; 
  reflectedParameters.forEach((reflectedParameter, index) => {
    if (!injectionParameters[index]) {
      injectionParameters[index] = createInjectionArgument(reflectedParameter, hooks, { ...metadata, kind: InjectionKind.PARAMETER, annotations: { ...annotations } });
    } else if (updateExisting) {
      const parameter = injectionParameters[index];
      parameter.hooks = [...hooks, ...parameter.hooks];
      parameter.metadata.annotations = { ...annotations, ...parameter.metadata.annotations };
    }
  });
}
