import { runInInjectionContext } from './inject';
import { destroyInjector } from './lifecycle-manager';
import { inject } from './resolver';
import { createInjectionMetadata, processProviders } from './metadata';
import { initModule, importModule, retrieveExtendedModule } from './module';
import { ADI } from '../adi';
import { MODULE_REF, INJECTOR_CONFIG, INITIALIZERS } from '../constants';
import { InjectionKind, InjectorStatus } from '../enums';
import { Optional, All } from '../hooks';
import { isExtendedModule, isModuleToken, wait, waitCallback, noopThen, noopCatch } from '../utils';
import { cacheMetaKey } from '../private';

import type { RunInContextArgument } from './inject'
import type { ClassType, ProviderToken, ProviderType, ProviderRecord, InjectionHook, InjectionAnnotations, InjectorInput, InjectorOptions, InjectionHookRecord, ModuleMetadata, InjectionContext } from '../types';

export class Injector<T = any> {
  static create<T, P>(
    input?: InjectorInput<T>,
    options?: InjectorOptions,
    parent?: Injector<P> | null,
  ): Injector<T> {
    return new Injector(input, options, parent);
  }

  private $: Injector<T> | Promise<Injector<T>> | undefined;
  private injectionCtx: InjectionContext = {
    injector: this, 
    metadata: createInjectionMetadata({ kind: InjectionKind.INJECTOR }), 
    session: undefined,
  }

  public status: InjectorStatus = InjectorStatus.NONE;
  public readonly imports = new Map<InjectorInput<T>, Injector<T>>();
  public readonly providers = new Map<ProviderToken<any>, { self: ProviderRecord | null, imported?: Array<ProviderRecord> }>();
  public readonly hooks: Array<InjectionHookRecord> = [];
  public readonly meta: Record<string | symbol, any> = {
    [cacheMetaKey]: new Map<any, any>(),
  };

  constructor(
    public readonly input: InjectorInput<T> = [],
    public readonly options: InjectorOptions = {},
    public readonly parent: Injector<T> | null | undefined = ADI.coreInjector,
  ) {
    if (typeof input === 'object' && typeof (input as ModuleMetadata).options === 'object') {
      options = { ...(input as ModuleMetadata).options, ...options };
    }

    if (options.importing === undefined) options.importing = true;
    if (options.exporting === undefined) options.exporting = true;
    if (options.initialize === undefined) options.initialize = true;
    if (options.scopes) {
      options.scopes = [...new Set(['any', input as ClassType, ...(options.scopes || [])])];
    } else {
      options.scopes = ['any', input as ClassType];
    }
  
    const providers: ProviderType[] = [];
    if (typeof input === 'function') { // module class
      providers.push(input as ClassType, { provide: MODULE_REF, useExisting: input });
    } else if (Array.isArray(input)) { // array of providers
      providers.push({ provide: MODULE_REF, useValue: input }, ...input);
    } else if (isExtendedModule(input)) { // object module
      const deepModule = retrieveExtendedModule(input);
      if (typeof deepModule === 'function' && isModuleToken(deepModule)) {
        providers.push({ provide: MODULE_REF, useValue: deepModule });
      } else {
        // TODO... throw error
      }
    } else {
      providers.push({ provide: MODULE_REF, useValue: input });
    }

    this.provide(
      { provide: Injector, useValue: this }, 
      { provide: INJECTOR_CONFIG, useValue: options }, 
      { provide: INITIALIZERS, hooks: [Optional(), All({ imported: false })] },
      ...providers
    );

    if (options.initialize) {
      this.$ = initModule(this);
    }
  }

  init(): Injector<T> | Promise<Injector<T>> {
    return this.$ || (this.$ = initModule(this));
  }

  destroy(): Promise<void> {
    return destroyInjector(this);
  }

  get<T = any>(token: ProviderToken<T>): T | Promise<T>;
  get<T = any>(annotations: InjectionAnnotations): T | Promise<T>;
  get<T = any>(...hooks: Array<InjectionHook>): T | Promise<T>;
  get<T = any>(token: ProviderToken<T>, annotations: InjectionAnnotations): T | Promise<T>;
  get<T = any>(token: ProviderToken<T>, ...hooks: Array<InjectionHook>): T | Promise<T>;
  get<T = any>(annotations: InjectionAnnotations, ...hooks: Array<InjectionHook>): T | Promise<T>;
  get<T = any>(token: ProviderToken<T>, annotations: InjectionAnnotations, ...hooks: Array<InjectionHook>): T | Promise<T>;
  get<T = any>(token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, ...hooks: Array<InjectionHook>): T | Promise<T> {
    if (this.status & InjectorStatus.DESTROYED || !(this.status & InjectorStatus.INITIALIZED)) {
      return undefined as T;
    }
    return inject(this.injectionCtx, token as any, annotations as any, ...hooks)
  }

  import<T>(input: InjectorInput<T> | Promise<InjectorInput<T>>): Injector<T> | Promise<Injector<T>> {
    if (this.status & InjectorStatus.DESTROYED || !this.options.importing) {
      return undefined as unknown as Injector<T> | Promise<Injector<T>>;
    }
    return importModule(this, input);
  }

  provide(...providers: ProviderType[]): void {
    if (this.status & InjectorStatus.DESTROYED) return;
    processProviders(this, providers);
  }

  run<R>(fn: (arg: RunInContextArgument) => R): R {
    if (this.status & InjectorStatus.DESTROYED || !(this.status & InjectorStatus.INITIALIZED)) {
      return undefined as R;
    }
    return runInInjectionContext(fn, this.injectionCtx);
  }

  of(): Injector;
  of(input: ModuleMetadata | Array<ProviderType>): Injector;
  of<R>(fn: (data: { injector: Injector }) => R): R;
  of<R>(input: ModuleMetadata | Array<ProviderType>, fn: (data: { injector: Injector }) => R): R;
  of<R>(inputOrFn?: ModuleMetadata | Array<ProviderType> | ((data: { injector: Injector }) => R), fn?: (data: { injector: Injector }) => R): R | Injector {
    if (this.status & InjectorStatus.DESTROYED || !(this.status & InjectorStatus.INITIALIZED)) {
      return undefined as R | Injector;
    }

    const isFunction = typeof inputOrFn === 'function';
    const injector = new Injector(isFunction ? [] : inputOrFn, { exporting: false }, this);
    if (isFunction) {
      fn = inputOrFn;
    }

    if (typeof fn === 'function') {
      return wait(
        injector.init(),
        inj => waitCallback(
          () => fn!({ injector: inj }),
          noopThen,
          noopCatch,
          () => inj.destroy(),
        ),
      );
    }
    return injector;
  }
}
