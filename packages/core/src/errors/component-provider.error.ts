import { ADIError, Errors } from "./error";

import type { Session } from "../injector";

export class ComponentProviderError extends ADIError<{ session: Session }> {
  error_code: Errors.COMPONENT_PROVIDER;

  createMessage(): string {
    return ''
  }
}
