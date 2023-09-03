import { getGlobalThis } from "./utils";

import type { Injector } from './injector';
import type { Plugin, PluginState, Events, EventKind, EventHandler, EventHandlerRef, EventContext } from './types';

export class ADI {
  static core: Injector;

  protected static plugins: Map<string, PluginState> = new Map();
  protected static handlers: Map<EventKind, Array<EventHandler<any>>> = new Map();
  protected static _injectors: Set<Injector> = new Set();

  static get injectors() {
    return this._injectors;
  }

  static use(plugin: Plugin, options?: { recreate: boolean }): typeof ADI {
    const name = plugin.name;
    const existingPlugin = this.getPlugin(name);
    if (existingPlugin) {
      if (!options?.recreate) {
        return this;
      }
      this.destroy(name)
    }

    const handlers: Array<EventHandlerRef> = [];
    const on: typeof ADI.on = (event, handler) => {
      const ref = this.on(event, handler);
      handlers.push(this.on(event, handler));
      return ref;
    }

    const state: PluginState = { name, plugin, handlers };
    plugin.install.apply(plugin, [this, { on, state }]);
    this.plugins.set(name, { name, plugin, handlers });
    return this;
  }

  static destroy(plugin: string | Plugin): typeof ADI {
    const state = this.getPlugin(plugin);
    if (state) {
      state.plugin.destroy?.apply(state, [this, { state }]);
      state.handlers.forEach(handler => handler.unsubscribe());
    }
    return this;
  }

  static on<K extends EventKind>(event: K, handler: EventHandler<K>): EventHandlerRef {
    const handlers = this.getHandlers(event);
    handlers.push(handler);

    const globalHandlers = this.handlers;
    let removed: boolean = false;
    return {
      unsubscribe() {
        if (removed) return;
        removed = true;
        const indexOf = handlers.indexOf(handler);
        handlers.splice(indexOf, 1);
        if (!handlers.length) {
          globalHandlers.delete(event);
        }
      }
    }
  }

  static emit<K extends EventKind>(event: K, payload: Events[K], ctx: EventContext): void {
    if (this.canEmit(event) === true) {
      this.getHandlers(event).forEach(handler => handler(payload, ctx));
    }
  }

  static emitAll<K extends EventKind>(event: K, payloads: Array<Events[K]>, ctx: EventContext): void {
    if (this.canEmit(event) === false || payloads.length === 0) {
      return;
    }

    const handlers = this.getHandlers(event);
    payloads.forEach(payload => handlers.forEach(handler => handler(payload, ctx)));
  }

  protected static canEmit(kind: EventKind) {
    return this.handlers.has(kind);
  }

  protected static getHandlers<K extends EventKind>(event: K): Array<EventHandler<K>> {
    let handlers = this.handlers.get(event);
    if (handlers === undefined) {
      this.handlers.set(event, (handlers = []));
    }
    return handlers;
  }

  protected static getPlugin(plugin: string | Plugin): PluginState | undefined {
    const name = typeof plugin === 'string' ? plugin : plugin.name;
    return this.plugins.get(name);
  }
}

function corePlugin(): Plugin {
  return {
    name: 'adi:plugin:core',
    install(adi) {
      adi.on('module:add', (_, { injector }) => {
        adi.injectors.add(injector);
      });
      adi.on('module:destroy', (_, { injector }) => {
        adi.injectors.delete(injector);
      });
    }
  }
}

export function installADI(coreInjector: Injector) {
  const global = getGlobalThis();
  if (global.$$adi !== undefined) {
    return;
  }
  global.$$adi = ADI;
  ADI.core = coreInjector;
  ADI.use(corePlugin());
}

export function getADI(): ADI {
  return getGlobalThis().$$adi;
}
