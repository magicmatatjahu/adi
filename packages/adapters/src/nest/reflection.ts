import { Optional, Ref } from '@adi/core'
import { Reflection } from '@adi/core/lib/utils'
import {
  OPTIONAL_DEPS_METADATA,
  OPTIONAL_PROPERTY_DEPS_METADATA,
  PARAMTYPES_METADATA,
  PROPERTY_DEPS_METADATA,
  SELF_DECLARED_DEPS_METADATA,
  SCOPE_OPTIONS_METADATA
} from '@nestjs/common/constants';

import type { ClassType, InjectionItem, Injections, PlainInjectionItem, InjectionHook, ProviderToken } from "@adi/core";
import type { ScopeOptions, InjectionToken, OptionalFactoryDependency, DynamicModule } from '@nestjs/common';

export function reflectClassInjections(type: ClassType): Injections {
  return {
    parameters: reflectParameters(type),
    properties: reflectProperties(type),
  }
}

export function reflectScope(type: ClassType): ScopeOptions {
  return Reflection.getMetadata(SCOPE_OPTIONS_METADATA, type);
}

export function reflectModule(type: ClassType) {
  return {
    imports: reflect('imports', type),
    providers: reflect('providers', type),
    exports: reflect('exports', type),
  }
}

export function isGlobalModule(type: ClassType, dynamicMetadata?: Partial<DynamicModule>): boolean {
  if (dynamicMetadata && dynamicMetadata.global) {
    return true;
  }
  return Boolean(Reflection.getMetadata(SCOPE_OPTIONS_METADATA, type));
}

export function convertFactoryDependencies(dependencies: Array<InjectionToken | OptionalFactoryDependency>): Array<PlainInjectionItem> {
  return dependencies.map(dependency => {
    if ((dependency as OptionalFactoryDependency).token !== undefined) {
      const { token, optional } = (dependency as OptionalFactoryDependency);
      const hooks = optional ? [optionalHook] : [];
      return { token, hooks, annotations: { nestAdapter: true } };
    }
    return { token: dependency as ProviderToken, hooks: [], annotations: { nestAdapter: true } };
  });
}

const optionalHook = Optional();

function reflectParameters(type: ClassType): Array<InjectionItem> {
  const designParameters = reflect(PARAMTYPES_METADATA, type);
  const selfParameters = reflect(SELF_DECLARED_DEPS_METADATA, type);
  const optionalParameters = reflect(OPTIONAL_DEPS_METADATA, type);

  const serializedSelf: Array<any> = [];
  selfParameters.forEach(({ index, param }) => {
    serializedSelf[index] = param;
  });

  const parameters: Array<InjectionItem> = [];
  designParameters.forEach((parameter, index) => {
    const hooks: Array<InjectionHook> = [];
    const token = serializedSelf[index] || parameter;
    if (optionalParameters.includes(index)) {
      hooks.push(optionalHook);
    }
    if (isForwardRef(token)) {
      hooks.push(Ref(() => token.forwardRef()));
    }
    parameters[index] = { token, hooks, annotations: { nestAdapter: true } };
  });

  return parameters;
}

function reflectProperties(type: ClassType): Record<string | symbol, InjectionItem> {
  const selfProperties = reflect(PROPERTY_DEPS_METADATA, type);
  const optionalProperties = reflect(OPTIONAL_PROPERTY_DEPS_METADATA, type);

  const properties: Record<string | symbol, InjectionItem> = {};
  selfProperties.forEach(({ key, type }) => {
    const hooks: Array<InjectionHook> = [];
    const token = type;
    if (optionalProperties.includes(key)) {
      hooks.push(optionalHook);
    }
    if (isForwardRef(token)) {
      hooks.push(Ref(() => token.forwardRef()));
    }
    properties[key] = { token, hooks, annotations: { nestAdapter: true } };
  });

  return properties;
}

function reflect(meta: string, type: ClassType): any[] {
  return Reflection.getMetadata(meta, type) || [];
}

function isForwardRef(value: unknown): value is { forwardRef: () => any } {
  return value && typeof (value as { forwardRef: () => any }).forwardRef === 'function'; 
}
