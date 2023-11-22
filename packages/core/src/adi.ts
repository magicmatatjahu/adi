import { Injector } from './injector';
import { getGlobalThis } from "./utils";
import { on, emit, emitAll } from './services/emitter.service';

import type { Plugin, PluginState, Events, EventKind, EventListener, EventListenerRef, EventContext } from './types';
import type { ADIOptions } from "./types/adi";

export class ADI {
  static core: Injector;

  protected static plugins: Map<string, PluginState> = new Map();
  protected static listeners: Map<EventKind, Array<EventListener<any>>> = new Map();
  protected static _config: ADIOptions = { stackoveflowDeep: 200 }

  static get config() {
    return this._config;
  }

  static use(options: Partial<ADIOptions>): typeof ADI;
  static use(plugin: Plugin, options?: { recreate: boolean }): typeof ADI;
  static use(optionsOrPlugin: Plugin | Partial<ADIOptions>, options?: { recreate: boolean }): typeof ADI {
    const name: string = (optionsOrPlugin as any)?.name;
    if (name === undefined) {
      this._config = {
        ...this._config,
        ...options || {},
      }
      return this;
    }

    const plugin = optionsOrPlugin as Plugin;
    const existingPlugin = this.getPlugin(name);
    if (existingPlugin) {
      if (!options?.recreate) {
        return this;
      }
      this.destroy(name)
    }

    const listeners: Array<EventListenerRef> = [];
    const on: typeof ADI.on = (event, listener) => {
      const ref = this.on(event, listener);
      listeners.push(this.on(event, listener));
      return ref;
    }

    const state: PluginState = { name, plugin, listeners };
    plugin.install.apply(plugin, [this, { on, state }]);
    this.plugins.set(name, { name, plugin, listeners });
    return this;
  }

  static destroy(plugin: string | Plugin): typeof ADI {
    const state = this.getPlugin(plugin);
    if (state) {
      state.plugin.destroy?.apply(state, [this, { state }]);
      state.listeners.forEach(listener => listener.unsubscribe());
    }
    return this;
  }

  static on<K extends EventKind>(event: K, listener: EventListener<K>): EventListenerRef {
    return on(this, event, listener);
  }

  static emit<K extends EventKind>(event: K, payload: Events[K], ctx: EventContext): void {;
    emit(this, event, payload, ctx)
  }

  static emitAll<K extends EventKind>(event: K, payloads: Array<Events[K]>, ctx: EventContext): void {
    emitAll(this, event, payloads, ctx)
  }

  protected static getPlugin(plugin: string | Plugin): PluginState | undefined {
    const name = typeof plugin === 'string' ? plugin : plugin.name;
    return this.plugins.get(name);
  }
}

export function installADI() {
  const global = getGlobalThis();
  if (global.$$adi !== undefined) {
    return;
  }

  global.$$adi = ADI;
  ADI.core = Injector.create([], { 
    name: 'adi:core-injector', 
    importing: false, 
    exporting: false, 
    scopes: [ADI, 'core']
  });;
}

export function getADI(): ADI {
  return getGlobalThis().$$adi;
}
