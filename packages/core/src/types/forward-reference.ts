export interface ForwardReference<T> {
  ref: () => T;
  _$ref: Function;
};