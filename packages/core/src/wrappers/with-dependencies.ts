import { InjectionItem, PlainInjections } from "../interfaces";
import { createWrapper } from "../utils/wrappers";

export const WithDependencies = createWrapper((injections: Array<InjectionItem> | PlainInjections) => {
  return (session, next) => {
    session.options.injections = injections;
    return next(session);
  }
}, { name: 'WithDependencies' });
