import { Annotations } from "../interfaces";
import { createWrapper } from "../utils";

export const Annotate = createWrapper((annotations: Annotations) => {
  return (session, next) => {
    session.addAnnotations(annotations);
    return next(session);
  }
}, { name: 'Annotate' });
