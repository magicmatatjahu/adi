import { Hook } from "./hook";
import { compareOrder } from "../injector/metadata";
import { filterDefinitions } from "../injector/provider";
import { wait, waitAll } from "../utils";

import type { Session, ProviderRecord, ProviderDefinition } from '../injector';
import type { InjectionHookResult, NextInjectionHook } from '../types';

export interface AllHookOptions {
  filter?: 'all' | 'satisfies';
  imported?: boolean;
}

const defaultOptions: AllHookOptions = {
  filter: 'satisfies',
  imported: true,
}

function customFilterDefinitions(provider: { self?: ProviderRecord | null, imported?: Array<ProviderRecord> }, session: Session, options: AllHookOptions): Array<ProviderDefinition> {
  if (options.imported && provider.imported) {
    const definitions: Array<ProviderDefinition> = [];
    // TODO: Check typings provider in filterDefinitions function
    [provider.self, ...provider.imported].forEach(provider => definitions.push(...filterDefinitions(provider as any, session, options.filter)));
    return definitions.sort(compareOrder);
  }

  // TODO: Check typings for provider.self
  return filterDefinitions(provider.self as any, session, options.filter);
}

function hook(session: Session, next: NextInjectionHook, options: AllHookOptions) {
  if (session.hasFlag('dry-run')) {
    return next(session);
  }

  const forkedSession = session.fork();
  forkedSession.setFlag('dry-run');

  return wait(
    next(forkedSession),
    () => {
      session.setFlag('side-effect');
      session.setFlag('collection');
      const injector = forkedSession.injector;

      // if injector doesn't exist - token doesn't exist
      if (!injector) {
        return next(session);
      }

      // TODO: Fix retrieved provider from injector, we should operate on providers from imported injector, not from host injector
      const provider = injector.providers.get(forkedSession.token!);
      // TODO: Check typing for provider
      const definitions = customFilterDefinitions(provider as any, forkedSession, options);

      const values: any[] = [];
      definitions.forEach(definition => {
        const instanceSession = session.fork();
        instanceSession.provider = (instanceSession.definition = definition).provider;
        values.push(next(instanceSession));
      })
      
      return waitAll(values);
    },
  );
}

export function All<NextValue>(options: AllHookOptions = {}) {
  options = { ...defaultOptions, ...options };
  return Hook(
    function allHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue[]> {
      return hook(session, next, options);
    },
    { name: 'adi:all' }
  )
}
