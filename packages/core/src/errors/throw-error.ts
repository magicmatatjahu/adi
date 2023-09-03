import { NotFoundProviderError } from './not-found-provider.error'

import { ADIError, Errors } from './error';

import type { ClassType } from '../types';

const errors: Record<Errors, ClassType<ADIError<any>>> = {
  [Errors.NOT_FOUND_PROVIDER]: NotFoundProviderError,
  [Errors.CIRCULAR_REFERENCE]: NotFoundProviderError,
  [Errors.COMPONENT_PROVIDER]: NotFoundProviderError,
}

export function throwError(code: Errors, ctx: Error) {
  if ("__ADI_DEV__") {
    const error = errors[code];
    throw new error(ctx)
  }

  
}
