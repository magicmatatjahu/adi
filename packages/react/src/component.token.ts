import { InjectionToken } from '@adi/core';

import type { JSXElementConstructor } from 'react';

export function createComponentToken<T>(name?: string) {
  return new InjectionToken<JSXElementConstructor<T>>({}, name);
}
