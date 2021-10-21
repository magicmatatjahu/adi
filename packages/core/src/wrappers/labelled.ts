import { createWrapper } from "../utils";

export const Labelled = createWrapper((labels: Record<string | symbol, any>) => {
  return (session, next) => {
    session.addLabels(labels);
    return next(session);
  }
});
