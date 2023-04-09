import { Injector } from '@adi/core';
import { isVue2 } from 'vue-demi'

import { INJECTOR_KEY } from './keys';

import type { InjectorInput, InjectorOptions } from '@adi/core';

export interface VueAdiPluginOptions {
  module: InjectorInput | Injector
  options?: InjectorOptions;
}

export const VueAdiPlugin = {
  install: (app: any, options: VueAdiPluginOptions) => {
    const { injector, isAsync } = createInjector(options.module, options.options, undefined); 

    // function destroy() {
    //   injector.destroy()
    // }

    // if (app.onUnmount) {
    //   app.onUnmount(destroy)
    // } else {
    //   const originalUnmount = app.unmount
    //   app.unmount = function vueUnmount() {
    //     destroy();
    //     originalUnmount();
    //   }
    // }

    if (isVue2) {
      // app.mixin({
      //   beforeCreate() {
      //     // HACK: taken from provide(): https://github.com/vuejs/composition-api/blob/master/src/apis/inject.ts#L30
      //     if (!this._provided) {
      //       const provideCache = {}
      //       Object.defineProperty(this, '_provided', {
      //         get: () => provideCache,
      //         set: (v) => Object.assign(provideCache, v),
      //       })
      //     }
      //     this._provided[INJECTOR_KEY] = injector
      //   },
      // })
    } else {
      app.provide(INJECTOR_KEY, injector)
    }
  }
}

const cache: Map<string | symbol, Injector> = new Map();
function createInjector(
  input: InjectorInput | Injector, 
  moduleOptions: InjectorOptions = {}, 
  parentInjector: Injector | null | undefined, 
): {
  injector: Injector | Promise<Injector>,
  isAsync: boolean,
} {
  const mod = input || [];
  let injector: Injector | Promise<Injector>;
  if (mod instanceof Injector) {
    injector = mod;
  }

  if (!injector) {
    moduleOptions.exporting = 'disabled';
    injector = Injector.create(mod as InjectorInput, moduleOptions, parentInjector || undefined).init();
  }

  return {
    injector,
    isAsync: false // isPromiseLike(injector),
  }
}