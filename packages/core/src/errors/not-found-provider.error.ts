import { ADIError, Errors } from "./error";
import { isInjectionToken } from "../utils";

import type { Session } from "../injector";

export class NotFoundProviderError extends ADIError<{ session: Session }> {
  error_code: Errors.NOT_FOUND_PROVIDER;

  createMessage(): string {
    const token = this.ctx.session.token;

    let name: string | undefined;
    if (typeof token === 'function' || isInjectionToken(token)) {
      name = token.name;
    } else if (typeof token === 'symbol') {
      name = token.toString();
    } else {
      name = token as string;
    }

    return `No provider for ${name}!`;
  }
}
