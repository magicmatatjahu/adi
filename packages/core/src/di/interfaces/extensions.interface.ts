export interface Extensions {
  [key: string]: Array<Extension>;
}

export interface Extension {
  toClass(): void;
  toParamater(): void;
  toProperty(): void;
  toMethod(): void;
}
