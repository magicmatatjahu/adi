import { createWrapper, Injector } from '@adi/core';

export const WithInjector = createWrapper((injector: Injector) => {
  return (session, next) => {
    session.injector = injector;
    return next(session);
  }
}, { name: 'WithInjector' });
