import { createWrapper } from '@adi/core';

export const Skip = createWrapper((value?: any) => {
  return () => value;
}, { name: 'Skip' });
