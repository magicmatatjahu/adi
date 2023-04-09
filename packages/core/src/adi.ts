import { getGlobalThis } from "./utils";

import type { Injector } from './injector';
import type { ADIPlugin, ADIEventKind, ADIEvents, ADIEventUnsubscribe } from './interfaces';

const enum ADIFlags {
  NONE = 0,
  PROVIDER_CREATE = 1,
  PROVIDER_DESTROY = 2,
  INSTANCE_CREATE = 4,
  INSTANCE_DESTROY = 8,
  MODULE_CREATE = 16,
  MODULE_DESTROY = 32,
}

const adiFlags: Record<ADIEventKind, ADIFlags> = {
  'provider:create': ADIFlags.PROVIDER_CREATE,
  'provider:destroy': ADIFlags.PROVIDER_DESTROY,
  'instance:create': ADIFlags.INSTANCE_CREATE,
  'instance:destroy': ADIFlags.INSTANCE_DESTROY,
  'module:create': ADIFlags.MODULE_CREATE,
  'module:destroy': ADIFlags.MODULE_DESTROY,
}

type PluginState = {
  name: string;
  plugin: ADIPlugin,
  unsubscribers: Array<ADIEventUnsubscribe>;
}

export class ADI {
  static coreInjector: Injector;
  protected static flags: ADIFlags = ADIFlags.NONE;
  protected static plugins: Map<string, PluginState> = new Map();
  protected static actions: Map<ADIEventKind, Array<(data: ADIEvents[ADIEventKind]) => any>> = new Map();
  protected static _injectors: Set<Injector> = new Set();

  static get injectors() {
    return this._injectors;
  }

  static use(plugin: ADIPlugin): typeof ADI {
    const name = plugin.name;
    if (this.plugins.has(name)) {
      return this;
    }

    const unsubscribers: ADIEventUnsubscribe[] = [];
    plugin.install.apply(plugin, [this, { unsubscribers }]);
    this.plugins.set(name, { name, plugin, unsubscribers });
    return this;
  }

  static destroy(plugin: string | ADIPlugin): typeof ADI {
    const existing = this.getPlugin(plugin);
    if (existing) {
      existing.plugin.destroy?.apply(existing, [this]);
      existing.unsubscribers.forEach(item => item.unsubscribe());
    }
    return this;
  }

  static on<K extends ADIEventKind>(event: K, action: (data: ADIEvents[K]) => void): ADIEventUnsubscribe {
    const actions = this.getActions(event);
    actions.push(action);
    this.flags |= adiFlags[event];

    return {
      unsubscribe() {
        const indexOf = actions.indexOf(action);
        actions.splice(indexOf, 1);
        if (!actions.length) {
          this.flags &= ~adiFlags[event];
        }
      }
    }
  }

  static emit<K extends ADIEventKind>(event: K, data: ADIEvents[K]): void {
    if (this.canEmit(event)) {
      const actions = this.getActions(event);
      actions.forEach(action => action(data));
    }
  }

  static emitAll<K extends ADIEventKind>(event: K, collection: Array<ADIEvents[K]>): void {
    if (this.canEmit(event)) {
      const actions = this.getActions(event);
      collection.forEach(item => actions.forEach(action => action(item)));
    }
  }

  protected static canEmit(flag: ADIEventKind) {
    return (this.flags & adiFlags[flag]) > 0;
  }

  protected static getActions(event: ADIEventKind): Array<(data: ADIEvents[ADIEventKind]) => any> {
    let actions: Array<(data: ADIEvents[ADIEventKind]) => void>;
    if (!this.actions.has(event)) {
      actions = [];
      this.actions.set(event, actions);
      return actions;
    }
    return this.actions.get(event);
  }

  protected static getPlugin(plugin: string | ADIPlugin): PluginState | undefined {
    const existing: PluginState = this.plugins.get(plugin as string);
    if (existing) {
      return existing;
    }

    for (const item of this.plugins.values()) {
      if (item.name === plugin) {
        return item;
      }
    }
  }
}

function corePlugin(): ADIPlugin {
  return {
    name: 'adi:plugin:core',
    install(adi) {
      adi.on('module:create', ({ injector }) => {
        adi.injectors.add(injector);
      });
      adi.on('module:destroy', ({ injector }) => {
        adi.injectors.delete(injector);
      });
    }
  }
}

export function installADI(coreInjector: Injector) {
  const global = getGlobalThis();
  if (global.ADI !== undefined) {
    return;
  }
  ADI.coreInjector = coreInjector;
  ADI.use(corePlugin());
  global.ADI = ADI;
}

export function getADI(): ADI {
  return getGlobalThis().ADI;
}
