export enum InjectionStatus {
  UNKNOWN = 1,
  PENDING = 2,
  RESOLVED = 4,
  CACHED = 8,
  CIRCULAR = 16,
}