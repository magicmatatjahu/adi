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
  PROXY_MODE = 2,
}
