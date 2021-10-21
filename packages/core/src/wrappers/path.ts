import { SessionStatus } from "../enums";
import { createWrapper, thenable } from "../utils";

function getDeepValue(value: object, props: string[]) {
  let result = value;
  for (const p of props) {
    if (result === null || result === undefined) {
      return result;
    }
    result = result[p];
  }
  return result;
}

export const Path = createWrapper((path: string) => {
  const props = path.split('.').filter(Boolean);
  return (session, next) => {
    if (session.status & SessionStatus.DRY_RUN) {
      return next(session);
    }

    return thenable(
      () => next(session),
      value => getDeepValue(value, props),
    );
  }
});