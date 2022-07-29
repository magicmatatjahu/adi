import { getGlobalThis } from "./utils";

import type { Injector } from "./injector";
import type { HookRecord } from "./interfaces";
import type { ADIPlugin, InstallPlugin } from "./plugins/plugin";

export type ADIEventKind = 
  | 'adi:injection:init'
  | 'adi:provider:init'
  | 'adi:provider:create'
  | 'adi:provider:destroy'
  | 'adi:module:init'
  | 'adi:module:create'
  | 'adi:module:destroy';

export type ADIEventData = 
  | ADIEventInjectionInitData
  | ADIEventProviderInitData
  | ADIEventProviderCreateData
  | ADIEventProviderDestroyData
  | ADIEventModuleInitData
  | ADIEventModuleCreateData
  | ADIEventModuleDestroyData;

export type ADIEventListener = (data: ADIEventData) => void;

export interface ADIEventInjectionInitData {
  injector: Injector;
}

export interface ADIEventProviderInitData {
  injector: Injector;
}

export interface ADIEventProviderCreateData {
  injector: Injector;
}

export interface ADIEventProviderDestroyData {
  injector: Injector;
}

export interface ADIEventModuleInitData {
  injector: Injector;
}

export interface ADIEventModuleCreateData {
  injector: Injector;
}

export interface ADIEventModuleDestroyData {
  injector: Injector;
}

export class ADI {
  static globalADI: ADI = new ADI();

  static use<O>(plugin: ADIPlugin<O> | InstallPlugin, options?: O): ADI {
    return this.globalADI.use(plugin, options);
  }

  static on(event: 'adi:injection:init', action: (data: ADIEventInjectionInitData) => void): void;
  static on(event: 'adi:provider:init', action: (data: ADIEventProviderInitData) => void): void;
  static on(event: 'adi:provider:create', action: (data: ADIEventProviderCreateData) => void): void;
  static on(event: 'adi:provider:destroy', action: (data: ADIEventProviderDestroyData) => void): void;
  static on(event: 'adi:module:init', action: (data: ADIEventModuleInitData) => void): void;
  static on(event: 'adi:module:create', action: (data: ADIEventModuleCreateData) => void): void;
  static on(event: 'adi:module:destroy', action: (data: ADIEventModuleDestroyData) => void): void;
  static on(event: ADIEventKind, action: (data: ADIEventData) => void): void {
    this.globalADI.on(event as any, action);
  }
  
  static run(event: 'adi:injection:init', data: ADIEventInjectionInitData): void;
  static run(event: 'adi:provider:init', data: ADIEventProviderInitData): void;
  static run(event: 'adi:provider:create', data: ADIEventProviderCreateData): void;
  static run(event: 'adi:provider:destroy', data: ADIEventProviderDestroyData): void;
  static run(event: 'adi:module:init', data: ADIEventModuleInitData): void;
  static run(event: 'adi:module:create', data: ADIEventModuleCreateData): void;
  static run(event: 'adi:module:destroy', data: ADIEventModuleDestroyData): void;
  static run(event: ADIEventKind, data: ADIEventData): void {
    this.globalADI.run(event as any, data);
  }

  protected plugins: Array<ADIPlugin | InstallPlugin>;
  protected hooks: Array<HookRecord>;
  protected actions: Map<ADIEventKind, Array<(data: ADIEventData) => any>>;

  use<O>(plugin: ADIPlugin<O> | InstallPlugin, options?: O): ADI {
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

  on(event: 'adi:injection:init', action: (data: ADIEventInjectionInitData) => void): void;
  on(event: 'adi:provider:init', action: (data: ADIEventProviderInitData) => void): void;
  on(event: 'adi:provider:create', action: (data: ADIEventProviderCreateData) => void): void;
  on(event: 'adi:provider:destroy', action: (data: ADIEventProviderDestroyData) => void): void;
  on(event: 'adi:module:init', action: (data: ADIEventModuleInitData) => void): void;
  on(event: 'adi:module:create', action: (data: ADIEventModuleCreateData) => void): void;
  on(event: 'adi:module:destroy', action: (data: ADIEventModuleDestroyData) => void): void;
  on(event: ADIEventKind, action: (data: ADIEventData) => void): void {
    this.getActions(event).push(action);
  }

  run(event: 'adi:injection:init', data: ADIEventInjectionInitData): void;
  run(event: 'adi:provider:init', data: ADIEventProviderInitData): void;
  run(event: 'adi:provider:create', data: ADIEventProviderCreateData): void;
  run(event: 'adi:provider:destroy', data: ADIEventProviderDestroyData): void;
  run(event: 'adi:module:init', data: ADIEventModuleInitData): void;
  run(event: 'adi:module:create', data: ADIEventModuleCreateData): void;
  run(event: 'adi:module:destroy', data: ADIEventModuleDestroyData): void;
  run(event: ADIEventKind, data: ADIEventData): void {
    const actions = this.getActions(event);
    return actions.length && this.runActions(this.getActions(event), data, 0);
  }

  private getActions(event: ADIEventKind): Array<(data: ADIEventData) => any> {
    let actions: Array<(data: ADIEventData) => void>;
    if (!this.actions.has(event)) {
      actions = [];
      this.actions.set(event, actions);
    }
    return actions;
  }

  private runActions(actions: Array<(data: ADIEventData) => any>, data: ADIEventData, index: number) {
    // return actions[index](data, (d) => runActions(hooks, d, index+1));
  };
}

function installADI() {
  const global = getGlobalThis()
  global.ADI = ADI.globalADI;
}
installADI();
