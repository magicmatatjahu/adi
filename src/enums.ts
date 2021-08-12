export enum InjectionStatus {
  UNKNOWN = 1,
  PENDING = 2,
  RESOLVED = 4,
  CACHED = 8,
  CIRCULAR = 16,
}

export enum ScopeFlags {
  NONE = 0,
  CAN_OVERRIDE = 1,
  SIDE_EFFECTS = 2,
  PROXY_MODE = 4,
  CANNOT_OVERRIDE = 8,
}

export enum InjectionPlace {
  TYPE = 0,
  CONSTRUCTOR_PARAMETER = 1,
  PROPERTY = 2,
  METHOD_ARGUMENT = 4,
  CUSTOM = 8,
}
