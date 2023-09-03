export enum Errors {
  NOT_FOUND_PROVIDER = 0x001_001,
  CIRCULAR_REFERENCE = 0x001_002,
  COMPONENT_PROVIDER = 0x001_003,
}

export abstract class ADIError<T> extends Error {
  abstract error_code: Errors

  constructor(
    public readonly ctx: T,
  ) {
    super('');
    this.message = this.createMessage()
  }

  abstract createMessage(): string;
}
