import { injectableDefinitions } from '../injector/injectable';
import { serializeInjectArguments, createInjectionArgument } from '../injector/metadata';
import { InjectionKind } from '../enums';
import { getDecoratorInfo, Reflection } from '../utils';

import type { ProviderToken, InjectionHook, InjectionAnnotations, PlainInjectionItem, InjectionArguments, InjectionArgument, ClassType, AbstractClassType, InjectionMetadata } from '../interfaces';
import type { Decorator } from '../utils';

export function Inject<T = any>(token?: ProviderToken<T>);
export function Inject<T = any>(hook?: InjectionHook);
export function Inject<T = any>(hooks?: Array<InjectionHook>);
export function Inject<T = any>(annotations?: InjectionAnnotations);
export function Inject<T = any>(token?: ProviderToken<T>, hook?: InjectionHook);
export function Inject<T = any>(token?: ProviderToken<T>, hooks?: Array<InjectionHook>);
export function Inject<T = any>(token?: ProviderToken<T>, annotations?: InjectionAnnotations);
export function Inject<T = any>(hook?: InjectionHook, annotations?: InjectionAnnotations);
export function Inject<T = any>(hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations);
export function Inject<T = any>(token?: ProviderToken<T>, hook?: InjectionHook, annotations?: InjectionAnnotations);
export function Inject<T = any>(token?: ProviderToken<T>, hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations);
export function Inject<T = any>(token?: ProviderToken<T> | InjectionHook | Array<InjectionHook> | InjectionAnnotations, hooks?: InjectionHook | Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations);
export function Inject<T = any>(token?: ProviderToken<T> | InjectionHook | Array<InjectionHook> | InjectionAnnotations, hooks?: InjectionHook | Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations): ParameterDecorator | PropertyDecorator {
  const injection = serializeInjectArguments(token, hooks, annotations);
  return function(target: Object, key: string | symbol, indexOrDescriptor?: number | PropertyDescriptor) {
    applyInject(getDecoratorInfo(target, key, indexOrDescriptor), injection);
  }
}

export function applyInject(decoratorInfo: Decorator, { token, hooks, annotations }: PlainInjectionItem) {
  const injections = injectableDefinitions.ensure(decoratorInfo.class).injections;
  const target = decoratorInfo.class;

  const argument = createInjectionArgument(token as ProviderToken, hooks as InjectionHook | Array<InjectionHook>, {
    kind: InjectionKind.UNKNOWN,
    target,
    annotations,
    static: (decoratorInfo as { static: boolean }).static || false,
    index: (decoratorInfo as { index: number }).index,
    key: (decoratorInfo as { key: string | symbol }).key,
    descriptor: (decoratorInfo as { descriptor: PropertyDescriptor }).descriptor,
  });

  const isStatic = argument.metadata.static;
  const targetObject = isStatic ? target : target.prototype;
  const key = (decoratorInfo as { key: string | symbol }).key;

  switch (decoratorInfo.kind) {
    case 'parameter': {
      const index = decoratorInfo.index;

      if (decoratorInfo.descriptor) { // method injection
        injections.status = true;
        argument.metadata.kind = InjectionKind.METHOD
        if (typeof argument.token === 'undefined') {
          argument.token = (Reflection.getOwnMetadata("design:paramtypes", targetObject, key) || [])[index];
        }
        const properInjections = getProperInjections(isStatic, injections);
        const parameters = properInjections.methods[key] || (properInjections.methods[key] = []);
        parameters[index] = argument; 
      } else { // constructor injection
        argument.metadata.kind = InjectionKind.PARAMETER;
        if (typeof argument.token === 'undefined') {
          argument.token = (Reflection.getOwnMetadata("design:paramtypes", target) || [])[index];
        }
        injections.parameters[index] = argument;
      }

      break;
    };
    case 'property':
    case 'accessor': {
      injections.status = true;
      argument.token = argument.token || Reflection.getOwnMetadata("design:type", targetObject, key);
      argument.metadata.kind = decoratorInfo.kind === 'property' ? InjectionKind.PROPERTY : InjectionKind.ACCESSOR;
      getProperInjections(isStatic, injections).properties[key] = argument;
      break;
    };
    case 'method': {
      injections.status = true;
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

function mergeMethodParameters(injectionParameters: Array<InjectionArgument> = [], reflectedParameters: Array<ClassType | AbstractClassType>, hooks: Array<InjectionHook>, annotations: InjectionAnnotations, metadata: InjectionMetadata) {
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
