import { Session, createHook, waitSequence } from '@adi/core';
import { convertInjections } from '@adi/core/lib/injector';
import { runHooks } from '@adi/core/lib/hooks/hook';

import type { Injector, InjectionItem, InjectionArgument, NextInjectionHook, InjectionHookContext } from '@adi/core';

function injectItem(argument: InjectionArgument, injector: Injector, parentSession: Session, next: NextInjectionHook, ctx: InjectionHookContext) {
  const session = Session.create(argument.token, argument.metadata, injector, parentSession);
  if (parentSession) {
    parentSession.children.push(session);
  }
  return runHooks(argument.hooks, session, ctx.kind, next);
}

export const Tuple = createHook((collection: Array<InjectionItem>) => {
  const converted = convertInjections(collection, {} as any);
  return (session, next, ctx) => {
    const serialized = converted.map(item => ({ ...item, metadata: { ...session.iMetadata } }));

    const injector = session.context.injector;
    const parent = session.parent;
    return waitSequence(
      serialized,
      item => injectItem(item, injector, parent, next, ctx),
    )
  }
}, { name: "adi:hook:tuple" });
