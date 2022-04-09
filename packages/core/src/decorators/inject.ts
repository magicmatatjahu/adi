import { ensureInjectableDefinition } from "./injectable";
import { InjectionKind } from "../enums";
import { InjectionToken } from "../injector/injection-token";
import { Reflection } from "../utils";

import { ProviderToken, InjectionHook, Annotations, InjectionMetadata, InjectionArgument } from "../interfaces";
import { createInjectionArgument } from "../injector/metadata";

export function Inject<T = any>(token?: ProviderToken<T>);
export function Inject<T = any>(hooks?: Array<InjectionHook>);
export function Inject<T = any>(annotations?: Annotations);
export function Inject<T = any>(token?: ProviderToken<T>, annotations?: Annotations);
export function Inject<T = any>(hooks?: Array<InjectionHook>, annotations?: Annotations);
export function Inject<T = any>(token?: ProviderToken<T>, hooks?: Array<InjectionHook>, annotations?: Annotations);
export function Inject<T = any>(token?: ProviderToken<T> | Array<InjectionHook> | Annotations, hooks?: Array<InjectionHook> | Annotations, annotations?: Annotations) {
  if (typeof token === 'object' && !(token instanceof InjectionToken)) { // case with one argument
    if (Array.isArray(token)) { // hooks
      annotations = hooks as Annotations;
      hooks = token;
    } else {
      annotations = token as Annotations;
    }
    token = undefined;
  } else if (typeof hooks === 'object' && !Array.isArray(hooks)) { // case with two arguments argument
    annotations = hooks as Annotations;
    hooks = [];
  }
  annotations = annotations || {};

  return function(target: Function, key: string | symbol, indexOrDescriptor?: number | PropertyDescriptor) {
    let handler: Function | undefined;
    if (token === undefined) {
      if (key === undefined) { // constructor injection
        token = Reflection.getOwnMetadata("design:paramtypes", target)[indexOrDescriptor as number];
      } else {
        if (indexOrDescriptor === undefined) { // property injection
          token = Reflection.getOwnMetadata("design:type", target, key);
        } else if (typeof indexOrDescriptor === 'number') { // method injection
          token = Reflection.getOwnMetadata("design:paramtypes", target, key)[indexOrDescriptor];
          handler = Object.getOwnPropertyDescriptor(target, key).value;
        } else { // setter injection
          token = Reflection.getOwnMetadata("design:type", target, key);
          handler = indexOrDescriptor.value;
          indexOrDescriptor = undefined;
        }
      }
    }
    applyInjectionArgument(token as ProviderToken, hooks as Array<InjectionHook>, { target, key, index: indexOrDescriptor as number, handler, annotations });
  }
}

function applyInjectionArgument(
  token: ProviderToken,
  hooks: Array<InjectionHook> = [],
  metadata: Omit<InjectionMetadata, 'kind'>,
): InjectionArgument {
  const { key, index } = metadata;

  // constructor injection
  if (key === undefined) {
    const def = ensureInjectableDefinition(metadata.target);
    return def.injections.parameters[index] = createInjectionArgument(token, hooks, { ...metadata, kind: InjectionKind.PARAMETER });
  }

  const target = metadata.target = metadata.target.constructor;
  const injections = ensureInjectableDefinition(target).injections;
  if (typeof index === "number") { // method injection
    const method = injections.methods[key as string] || (injections.methods[key as string] = []);
    return method[index] = createInjectionArgument(token, hooks, { ...metadata, kind: InjectionKind.METHOD });
  }
  // property injection
  return injections.properties[key as string] = createInjectionArgument(token, hooks, { ...metadata, kind: InjectionKind.PROPERTY });
}
