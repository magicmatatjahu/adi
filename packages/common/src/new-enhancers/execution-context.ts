import type { ExecutionContextKind, ExecutionContextMetadata } from './types';

export class ExecutionContext<K extends keyof ExecutionContextKind = keyof ExecutionContextKind> {
  static create<K extends keyof ExecutionContextKind = keyof ExecutionContextKind>(
    kind: K,
    data: ExecutionContextKind[K],
    instance: any,
    metadata: ExecutionContextMetadata
  ): ExecutionContext {
    return new this(kind, data, instance, metadata)
  }

  protected constructor(
    public readonly kind: K,
    public readonly data: ExecutionContextKind[K],
    public readonly instance: any,
    public readonly metadata: ExecutionContextMetadata,
  ) {}
}
