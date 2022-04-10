import { InjectionKind } from "../enums";

import type { Injector, Session } from "../injector";

export function getHostInjector(session: Session): Injector | undefined {
  if (session.parent) return session.parent.ctx.record.host;
  if (session.metadata.kind & InjectionKind.STANDALONE) return session.metadata.target as Injector;
  return;
}
