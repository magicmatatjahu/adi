export enum ProviderKind {
  CLASS = 'class',
  FACTORY = 'factory',
  VALUE = 'value',
  PROVIDER = 'provider',
  ALIAS = 'alias',
  CUSTOM = 'custom'
}

export const enum DefinitionStatus {
  NONE = 0,
  IS_DEFAULT = 1,
}

export const enum InstanceStatus {
  UNKNOWN = 0,
  PENDING = 1,
  RESOLVED = 1 << 1,
  DESTROYED = 1 << 2,
  DEFINITION_DESTROYED = 1 << 3,
  DYNAMIC_SCOPE = 1 << 4,
  HAS_DYNAMIC_SCOPE = 1 << 5,
  PARALLEL = 1 << 6,
  CIRCULAR = 1 << 7,
}

export enum InjectionKind {
  UNKNOWN = 'unknown',
  INJECTOR = 'injector',
  PARAMETER = 'parameter',
  PROPERTY = 'property',
  METHOD = 'method',
  ACCESSOR = 'accessor',
  FACTORY = 'factory',
  FUNCTION = 'function',
  SCOPE = 'scope',
  CUSTOM = 'custom',
}

export const enum InjectableStatus {
  NONE = 0,
  DEFINITION_RESOLVED = 1,
}

export const enum InjectorStatus {
  NONE = 0,
  PENDING = 1,
  INITIALIZED = 1 << 1,
  ACTIVE = 1 << 2,
  DESTROYED = 1 << 3,
  HAS_HOOKS = 1 << 4,
  SCOPED = 1 << 5,
  PROXY = 1 << 6,
}

export const enum SessionFlag {
  NONE = 0,
  RESOLVED = 1,
  SIDE_EFFECTS = 1 << 1,
  DYNAMIC = 1 << 2,
  ASYNC = 1 << 3,
  COLLECTION = 1 << 4,
  DRY_RUN = 1 << 5,
  DYNAMIC_SCOPE = 1 << 6,
  DYNAMIC_RESOLUTION = 1 << 7,
  PARALLEL = 1 << 8,
  CIRCULAR = 1 << 9,
}

export enum InjectionHookKind {
  INJECTOR = 'injector',
  INJECT = 'inject',
  PROVIDER = 'provider',
  DEFINITION = 'definition',
}

export enum ProvideIn {
  CORE = 'core',
  ROOT = 'root',
  ANY = 'any',
  ANYWHERE = 'any',
}
