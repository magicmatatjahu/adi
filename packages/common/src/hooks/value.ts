import { createWrapper } from '@adi/core';

export const Value = createWrapper((value: any) => {
  return () => value;
}, { name: 'Value' });
