import { createWrapper, InjectionItem, PlainInjections } from '@adi/core';

export const WithDependencies = createWrapper((injections: Array<InjectionItem> | PlainInjections) => {
  return (session, next) => {
    session.options.injections = injections;
    return next(session);
  }
}, { name: 'WithDependencies' });
