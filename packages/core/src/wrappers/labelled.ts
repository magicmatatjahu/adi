import { Annotations } from "../interfaces";
import { createWrapper } from "../utils";

export const Labelled = createWrapper((labels: Annotations) => {
  return (session, next) => {
    session.addLabels(labels);
    return next(session);
  }
});
