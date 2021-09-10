export enum InjectionStatus {
  UNKNOWN = 1,
  PENDING = 2,
  RESOLVED = 4,
  CIRCULAR = 8,
}

export enum ScopeFlags {
  NONE = 0,
  CANNOT_OVERRIDE = 1,
  PROXY_MODE = 4,
}

export enum InjectionPlace {
  TYPE = 0,
  CONSTRUCTOR_PARAMETER = 1,
  PROPERTY = 2,
  METHOD_ARGUMENT = 4,
  CUSTOM = 8,
}

export enum SessionStatus {
  NONE = 0,
  ASYNC = 1,
  SIDE_EFFECTS = 2,
  DRY_RUN = 4,
}

export enum InjectorStatus {
  NONE = 0,
  INITIALIZED = 1,
  DESTROYED = 2,
  PROXY_MODE = 4,
}