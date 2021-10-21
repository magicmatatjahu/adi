import { Injector } from "../injector";
import { createWrapper } from "../utils";

export const WithInjector = createWrapper((injector: Injector) => {
  return (session, next) => {
    session.injector = injector;
    return next(session);
  }
});
