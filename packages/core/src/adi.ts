import { getGlobalThis } from "./utils";

import type { Injector } from './injector';
import type { ADIPlugin, InstallPlugin, ADIEvents } from './interfaces';

type ADIEventKind = keyof ADIEvents;

const enum ADIFlags {
  NONE = 0,
  PROVIDER_CREATE = 1,
  PROVIDER_DESTROY = 2,
  MODULE_CREATE = 4,
  MODULE_DESTROY = 8,
}

const adiFlags: Record<ADIEventKind, ADIFlags> = {
  'provider:create': ADIFlags.PROVIDER_CREATE,
  'provider:destroy': ADIFlags.PROVIDER_DESTROY,
  'module:create': ADIFlags.MODULE_CREATE,
  'module:destroy': ADIFlags.MODULE_DESTROY,
}

export class ADI {
  static coreInjector: Injector;
  protected static flags: ADIFlags = ADIFlags.NONE;
  protected static injectors: Array<ADIPlugin | InstallPlugin> = [];
  protected static plugins: Array<ADIPlugin | InstallPlugin> = [];
  protected static actions: Map<ADIEventKind, Array<(data: ADIEvents[ADIEventKind]) => any>> = new Map();

  static use<O>(plugin: ADIPlugin<O> | InstallPlugin, options?: O): typeof ADI {
    if (
      this.plugins.includes(plugin) ||
      this.plugins.some(p => p.name === plugin.name)
    ) {
      return this;
    }

    if (typeof plugin === 'object' && typeof plugin.install === 'function') {
      plugin.install.apply(plugin, [this, options]);
    } else if (typeof plugin === 'function') {
      plugin(this);
    }

    this.plugins.push(plugin);
    return this;
  }

  static on<K extends ADIEventKind>(event: K, action: (data: ADIEvents[K]) => void): { unsubscribe: () => void } {
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
    const actions = this.getActions(event);
    if (actions) {
      actions.forEach(action => action(data));
    }
  }

  static canEmit(flag: ADIEventKind) {
    return (this.flags & adiFlags[flag]) > 0;
  }

  protected static getActions(event: ADIEventKind): Array<(data: ADIEvents[ADIEventKind]) => any> {
    let actions: Array<(data: ADIEvents[ADIEventKind]) => void>;
    if (!this.actions.has(event)) {
      actions = [];
      this.actions.set(event, actions);
    }
    return actions;
  }
}

export function installADI(coreInjector: Injector) {
  ADI.coreInjector = coreInjector;
  getGlobalThis().ADI = ADI;
}
