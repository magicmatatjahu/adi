export enum ProviderKind {
  CLASS = 1,
  FACTORY = 2,
  VALUE = 4,
  ALIAS = 8,
}

export enum InstanceStatus {
  UNKNOWN = 1,
  PENDING = 2,
  RESOLVED = 4,
  DESTROYED = 8,
  DEFINITION_DESTROYED = 16,
  CIRCULAR = 32,
}

export enum InjectionKind {
  STANDALONE = 1,
  PARAMETER = 2,
  PROPERTY = 4,
  METHOD = 8,
  FACTORY = 16,
  FUNCTION = 32,
}

export enum SessionFlag {
  NONE = 1,
  SIDE_EFFECTS = 2,
  DRY_RUN = 4,
  CIRCULAR = 8,
}

export enum InjectorStatus {
  NONE = 0,
  INITIALIZED = 1,
  DESTROYED = 2,
}
