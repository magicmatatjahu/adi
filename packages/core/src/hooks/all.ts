import { createHook } from "./hook";
import { SessionFlag } from "../enums";
import { compareOrder, filterProviderDefinitions } from "../injector";
import { wait, waitAll } from "../utils";

import type { Session } from '../injector';
import type { NextHook, ProviderDefinition, ProviderRecord } from '../interfaces';

export interface AllHookOptions {
  // from?: 'self';
  filterMode?: 'defaults' | 'constraints' | 'all';
}

function filterDefinitions(records: Array<ProviderRecord>, session: Session, mode: AllHookOptions['filterMode']): Array<ProviderDefinition> {
  const defs: Array<ProviderDefinition> = [];
  records.forEach(record => defs.push(...filterProviderDefinitions(record.defs, session, mode)));
  return defs.sort(compareOrder);
}

function allHook(session: Session, next: NextHook, options: AllHookOptions) {
  if (session.hasFlag(SessionFlag.DRY_RUN)) {
    return next(session);
  }

  session.setFlag(SessionFlag.SIDE_EFFECTS);
  // fork session
  const forkedSession = session.fork();
  forkedSession.setFlag(SessionFlag.DRY_RUN);

  wait(
    next(forkedSession), // run to update session
    () => {
      // retrieve all satisfied definitions
      const records = session.ctx.injector.providers.get(forkedSession.options.token);
      if (!records || records.length === 0) return [];
      const defs = filterDefinitions(records, forkedSession, options.filterMode);

      const values = [];
      defs.forEach(def => {
        const instanceSession = session.fork();
        instanceSession.ctx.record = (instanceSession.ctx.def = def).record;
        values.push(next(instanceSession));
      })
      return waitAll(values);
    }
  );
}

const defaultOptions: AllHookOptions = {
  filterMode: 'constraints',
}

export const All = createHook((options: AllHookOptions = {}) => {
  options = { ...defaultOptions, ...options };
  return (session, next) => allHook(session, next, options);
}, { name: 'adi:hook:all' });
