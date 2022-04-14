import { InjectionToken } from '@adi/core';

import type { JSXElementConstructor, PropsWithChildren } from 'react';

export function createComponentToken<T>(name?: string) {
  return new InjectionToken<JSXElementConstructor<PropsWithChildren<T>>>({}, name);
}
