import { Token } from "./types";

export class NilInjectorError extends Error {
  public isNilInjectorError = true;

  constructor(token: Token) {
    super(`NilInjector: No provider for ${token as any}!`);
  }
}
