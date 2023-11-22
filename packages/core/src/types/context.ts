export interface ContextOptions {
  name?: string
}

export interface ContextMetadata {
  [key: string | symbol]: any;
}

export interface ContextRegistry {
  [name: string | symbol]: any;
}

export interface ContextData {
  [key: string | symbol]: any;
}

export type InferredContextData<T> =
  T extends string ? ContextRegistry[T] :
  T extends symbol ? ContextRegistry[T] :
  ContextData;
