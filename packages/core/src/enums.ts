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
  CIRCULAR = 64,
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
}

export enum SessionFlag {
  NONE = 0,
  RESOLVED = 1,
  SIDE_EFFECTS = 2,
  DRY_RUN = 4,
  HAS_DYNAMIC = 8,
  CIRCULAR = 16,
}