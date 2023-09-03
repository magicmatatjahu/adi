import { ADIError, Errors } from "./error";

import type { Session } from "../injector";

export class CircularReferenceError extends ADIError<{ session: Session }> {
  error_code: Errors.CIRCULAR_REFERENCE;

  createMessage(): string {
    return ''
  }
}
