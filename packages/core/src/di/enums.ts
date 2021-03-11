// PUBLIC

export enum ContextAccessModifier {
  PUBLIC = 0,
  PROTECTED = 1,
  PRIVATE = 2,
}

export enum InjectionFlags {
  DEFAULT = 0,
  OPTIONAL = 1,
  SELF = 2,
  SKIP_SELF = 4,
  LAZY = 8,
  NO_INJECT = 16,
  CONSTRUCTOR_PARAMETER = 32,
  PROPERTY = 64,
  METHOD_PARAMETER = 128,
  FACTORY = 256,
}

export enum ModuleType {
  SHARED = 'shared',
  DOMAIN = 'domain',
  INLINE = 'inline',
}

export enum ScopeFlags {
  NONE = 0,
  CAN_OVERRIDE = 1,
  PROXY_MODE = 2,
}

export enum InjectionStatus {
  UNKNOWN = 1,
  PENDING = 2,
  RESOLVED = 4,
  CACHED = 8,
  CIRCULAR = 16,
}

export enum ProviderType {
  TYPE = 1,
  CLASS = 2,
  CONSTRUCTOR = 4,
  STATIC_CLASS = 8,
  FACTORY = 16,
  EXISTING = 32,
  VALUE = 64,
  MULTI = 128,
  CUSTOM = 256,
}

export enum ProviderDefFlags {
  NONE = 0,
  EXPORT = 1,
}

// PRIVATE

export enum InjectionRecordFlags {
  // One of deps (also looking very deep - deps of dep) has proxy-moded scope
  HAS_PROXY_MODE = 1,
}

export enum DecoratorType {
  CLASS = 1,

  PROPERTY = 2,
  STATIC_PROPERTY = 4,

  METHOD_PARAMETER = 8,
  CONSTRUCTOR_PARAMETER = 16,
  STATIC_PARAMETER = 32,

  METHOD = 64,
  STATIC_METHOD = 128,

  GETTER_ACCESSOR = 256,
  STATIC_GETTER_ACCESSOR = 512,
  SETTER_ACCESSOR = 1024,
  STATIC_SETTER_ACCESSOR = 2048,

  PARAMETER = METHOD_PARAMETER | CONSTRUCTOR_PARAMETER | STATIC_PARAMETER,
  ACCESSOR = GETTER_ACCESSOR | STATIC_GETTER_ACCESSOR | SETTER_ACCESSOR | STATIC_SETTER_ACCESSOR,
  STATIC = STATIC_PROPERTY | STATIC_PARAMETER | STATIC_METHOD | STATIC_GETTER_ACCESSOR | STATIC_SETTER_ACCESSOR,
}

// RESOLUTION_CHECK is a flag for first check in resolve() function. It's using only for optimization
export const RESOLUTION_CHECK = InjectionFlags.SELF | InjectionFlags.SKIP_SELF | InjectionFlags.NO_INJECT;
