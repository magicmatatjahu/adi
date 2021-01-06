import { Token } from "../types";

export interface ForwardRef<T = any> {
  ref: () => T;
  _$ref: Function;
}

export interface DefinitionRef {
  token: Token;
  _$ref: Function;
}
