export enum ProviderKind {
  CLASS = 'class',
  FACTORY = 'factory',
  VALUE = 'value',
  PROVIDER = 'provider',
  ALIAS = 'alias',
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
  CUSTOM = 'custom',
  STANDALONE = 'standalone',
  PARAMETER = 'parameter',
  PROPERTY = 'property',
  ACCESSOR = 'accessor',
  FACTORY = 'factory',
  FUNCTION = 'function',
}

export enum InjectorStatus {
  NONE = 0,
  PENDING = 1,
  INITIALIZED = 2,
  DESTROYED = 4,
  PROXY = 8,
}

export enum SessionFlag {
  NONE = 0,
  RESOLVED = 1,
  SIDE_EFFECTS = 2,
  DRY_RUN = 4,
  DYNAMIC_SCOPE = 8,
  CIRCULAR = 16,
}

export enum InjectionHookKind {
  INJECTOR = 'injector',
  INJECT = 'inject',
  PROVIDER = 'provider',
  DEFINITION = 'definition',
}
