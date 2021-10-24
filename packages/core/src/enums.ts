export enum InstanceStatus {
  UNKNOWN = 1,
  PENDING = 2,
  RESOLVED = 4,
  DESTROYED = 8,
  CIRCULAR = 16,
  // Host Injector is destroyed
  HOST_DESTROYED = 32,
}

export enum ScopeFlags {
  NONE = 0,
  CANNOT_OVERRIDE = 1,
  PROXY_MODE = 4,
}

export enum InjectionKind {
  STANDALONE = 0,
  PARAMETER = 1,
  PROPERTY = 2,
  METHOD = 4,
  FUNCTION = 8,
  // TODO: Add FACTORY and destroy transient instances in FUNCTION/CUSTOM kind
}

export enum SessionStatus {
  NONE = 0,
  ASYNC = 1,
  SIDE_EFFECTS = 2,
  DRY_RUN = 4,
  COMPONENT_RESOLUTION = 8,
}

export enum InjectorStatus {
  NONE = 0,
  BUILDED = 1,
  INITIALIZED = 2,
  DESTROYED = 4,
  PROXY_MODE = 8,
}