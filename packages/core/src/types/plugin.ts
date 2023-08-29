import type { ADI } from '../adi'
import type { EventKind, EventHandler, EventHandlerRef } from './events'

export interface Plugin {
  name: string;
  install: (adi: typeof ADI, ctx: InstallPluginContext) => void;
  destroy?: (adi: typeof ADI, ctx: DestroyPluginContext) => void;
}

export interface PluginState {
  name: string;
  plugin: Plugin,
  handlers: Array<EventHandlerRef>;
}

export interface InstallPluginContext {
  state: PluginState;
  on<K extends EventKind>(event: K, handler: EventHandler): EventHandlerRef
}

export interface DestroyPluginContext {
  state: PluginState;
}
