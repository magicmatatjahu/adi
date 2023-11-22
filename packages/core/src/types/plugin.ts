import type { ADI } from '../adi'
import type { EventKind, EventListener, EventListenerRef } from './events'

export interface Plugin {
  name: string;
  install: (adi: typeof ADI, ctx: InstallPluginContext) => void;
  destroy?: (adi: typeof ADI, ctx: DestroyPluginContext) => void;
}

export interface PluginState {
  name: string;
  plugin: Plugin,
  listeners: Array<EventListenerRef>;
}

export interface InstallPluginContext {
  state: PluginState;
  on<K extends EventKind>(event: K, listener: EventListener<K>): EventListenerRef
}

export interface DestroyPluginContext {
  state: PluginState;
}
