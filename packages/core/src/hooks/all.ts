import { createHook } from "./create-hook";
import { compareOrder } from "../injector/metadata";
import { filterDefinitions } from "../injector/provider";
import { wait, waitAll } from "../utils";

import type { Session } from '../injector/session';
import type { InjectionHookResult, NextInjectionHook, ProviderRecord, ProviderDefinition } from '../types';

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
    [provider.self, ...provider.imported].forEach(provider => definitions.push(...filterDefinitions(provider, session, options.filter)));
    return definitions.sort(compareOrder);
  }

  return filterDefinitions(provider.self, session, options.filter);
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
      const injector = forkedSession.context.injector;

      // if injector doesn't exist - token doesn't exist
      if (!injector) {
        return next(session);
      }

      // TODO: Fix retrieved provider from injector, we should operate on providers from imported injector, not from host injector
      const { context, inject } = forkedSession;
      const provider = context.injector.providers.get(inject.token!);
      const definitions = customFilterDefinitions(provider, forkedSession, options);

      const values: any[] = [];
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
  return <ResultType>(session: Session, next: NextInjectionHook<ResultType>): InjectionHookResult<Array<ResultType>> => {
    return allHook(session, next, options);
  }
}, { name: 'adi:hook:all' });
