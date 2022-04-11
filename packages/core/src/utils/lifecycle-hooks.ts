import type { Session } from "../injector";
import type { ProviderInstance } from "../interfaces";

// export function handleOnInit(session: Session, instance: ProviderInstance) {
//   if (session[SESSION_INTERNAL.CIRCULAR]) { // when resolution chain has circular reference
//     return handleOnInitCircular(instance, session);
//   } else if (session.parent?.[SESSION_INTERNAL.CIRCULAR] === undefined) {
//     return runInitHook(instance, session);
//   }
// }