import type { Injector } from '../injector/injector';
import type { Session } from '../injector/session';
import type { ModuleImportType } from './module';
import type { ProviderType } from './provider';
import type { ProviderRecord, ProviderDefinition, ProviderInstance } from './provider-record';

export interface OnProviderAddPayload { 
  original: ProviderType;
  provider?: ProviderRecord;
  definition?: ProviderDefinition;
}

export interface OnProviderDestroyPayload { 
  definition: ProviderDefinition;
}

export interface OnInstanceCreatePayload { 
  session: Session;
  instance: ProviderInstance;
}

export interface OnInstanceDestroyPayload { 
  session: Session;
  instance: ProviderInstance;
}

export interface OnModuleAddPayload { 
  original: ModuleImportType;
}

export interface OnModuleDestroyPayload {}

export interface Events {
  'provider:add': OnProviderAddPayload,
  'provider:destroy': OnProviderDestroyPayload,
  'instance:create': OnInstanceCreatePayload,
  'instance:destroy': OnInstanceDestroyPayload,
  'module:add': OnModuleAddPayload,
  'module:destroy': OnModuleDestroyPayload,
}

export interface EventContext {
  injector: Injector;
}

export type EventKind = keyof Events;

export type EventHandler<K extends EventKind, T = void> = (payload: Events[K], ctx: EventContext) => T;

export type EventHandlerRef = {
  unsubscribe: () => void;
}

