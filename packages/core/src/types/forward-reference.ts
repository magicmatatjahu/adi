export interface ForwardReference<T = any> {
  ref: () => T;
  _$ref: Function;
};