export enum ProviderKind {
  CLASS = 'class',
  FACTORY = 'factory',
  VALUE = 'value',
  PROVIDER = 'provider',
  ALIAS = 'alias',
  CUSTOM = 'custom'
}

export enum InstanceStatus {
  UNKNOWN = 1,
  PENDING = 2,
  RESOLVED = 8,
  DESTROYED = 16,
  DEFINITION_DESTROYED = 32,
  PARALLEL = 64,
  CIRCULAR = 128,
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

export enum InjectableStatus {
  NONE = 0,
  INITIALIZED = 1,
  ONLY_CONSTRUCTOR_DEPS = 2,
}

export enum InjectorStatus {
  NONE = 0,
  PENDING = 1,
  INITIALIZED = 2,
  DESTROYED = 4,
  HAS_HOOKS = 8,
  PROXY = 16,
}

export enum SessionFlag {
  NONE = 0,
  RESOLVED = 1,
  SIDE_EFFECTS = 2,
  DYNAMIC = 4,
  ASYNC = 8,
  DYNAMIC_SCOPE = 16,
  DRY_RUN = 32,
  PARALLEL = 64,
  CIRCULAR = 128,
}

export enum InjectionHookKind {
  INJECTOR = 'injector',
  INJECT = 'inject',
  PROVIDER = 'provider',
  DEFINITION = 'definition',
}

export enum ProvideIn {
  CORE = 'core',
  ANY = 'any',
  ROOT = 'root',
}
