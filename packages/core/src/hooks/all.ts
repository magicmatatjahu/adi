import { createHook } from "./hook";
import { compareOrder } from "../injector/metadata";
import { wait, waitAll } from "../utils";

import type { Session, Provider } from '../injector';
import type { NextInjectionHook, ProviderDefinition } from '../interfaces';

export interface AllHookOptions {
  filter?: 'defaults' | 'constraints' | 'all';
  imported?: boolean;
}

const defaultOptions: AllHookOptions = {
  filter: 'all',
  imported: true,
}

function filterDefinitions(providers: { self: Provider, imported?: Array<Provider> }, session: Session, options: AllHookOptions): Array<ProviderDefinition> {
  if (options.imported && providers.imported) {
    const definitions: Array<ProviderDefinition> = [];
    [providers.self, ...providers.imported].forEach(provider => definitions.push(...provider.filter(session, options.filter)));
    return definitions.sort(compareOrder);
  }

  return providers.self.filter(session, options.filter);
}

function allHook(session: Session, next: NextInjectionHook, options: AllHookOptions) {
  if (session.hasFlag('dry-run')) {
    return next(session);
  }

  const forkedSession = session.fork();
  forkedSession.setFlag('dry-run');

  return wait(
    next(forkedSession),
    () => {
      session.setFlag('side-effect');

      // TODO: Fix retrieved provider from injector, we can operate on providers from imported injector, not from host injector
      const providers = forkedSession.context.injector.providers.get(forkedSession.iOptions.token);
      const definitions = filterDefinitions(providers, forkedSession, options);

      const values: Array<any> = [];
      definitions.forEach(definition => {
        const instanceSession = session.fork();
        instanceSession.context.provider = (instanceSession.context.definition = definition).provider;
        values.push(next(instanceSession));
      })
      return waitAll(values);
    },
  );
}

export const All = createHook((options: AllHookOptions = {}) => {
  options = { ...defaultOptions, ...options };
  return (session, next) => allHook(session, next, options);
}, { name: 'adi:hook:all' });
