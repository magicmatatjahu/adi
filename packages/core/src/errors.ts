import { Token } from "./types";

export class NilInjectorError extends Error {
  constructor(token: Token) {
    super(`NilInjector: No provider for ${(token as any).name ? (token as any).name : token}!`);
  }
}
