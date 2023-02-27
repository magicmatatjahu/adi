import { destroyInjector } from './lifecycle-manager';
import { Session } from './session';
import { inject } from './resolver';
import { processProviders, serializeInjectArguments, createInjectionArgument } from './metadata';
import { initModule, importModule, retrieveExtendedModule } from './module';
import { ADI } from '../adi';
import { MODULE_REF, INJECTOR_CONFIG, INITIALIZERS } from '../constants';
import { InjectorStatus, InjectionKind } from '../enums';
import { Optional, All } from '../hooks';
import { isExtendedModule, isModuleToken } from '../utils';

import type { Provider } from './provider';
import type { ClassType, ProviderToken, ProviderType, InjectionHook, InjectionAnnotations, InjectorInput, InjectorOptions, HookRecord, ModuleImportType } from '../interfaces';

export class Injector {
  static create(
    input?: InjectorInput,
    options?: InjectorOptions,
    parent?: Injector | null,
  ): Injector {
    return new Injector(input, options, parent);
  }

  public status: InjectorStatus = InjectorStatus.NONE;
  public readonly imports = new Map<InjectorInput, Injector>();
  public readonly providers = new Map<ProviderToken, { self: Provider, imported?: Array<Provider> }>();
  public readonly hooks: Array<HookRecord> = [];
  public readonly meta: Record<string | symbol, any> = {};

  constructor(
    public readonly input: InjectorInput = [],
    public readonly options: InjectorOptions = {},
    public readonly parent: Injector | null | undefined = null,
  ) {
    if (!parent) {
      parent = ADI.coreInjector;
    }

    options.importing = options.importing || 'enabled';
    options.exporting = options.exporting || 'enabled';
    options.scopes = ['any', input as ClassType, ...(options.scopes || [])];
  
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
  }

  init(): Injector | Promise<Injector> {
    return initModule(this);
  }

  destroy(): Promise<void> {
    return destroyInjector(this);
  }

  get<T = any>(token?: ProviderToken<T>, session?: Session): T | Promise<T>;
  get<T = any>(hook?: InjectionHook, session?: Session): T | Promise<T>;
  get<T = any>(hooks?: Array<InjectionHook>, session?: Session): T | Promise<T>;
  get<T = any>(annotations?: InjectionAnnotations, session?: Session): T | Promise<T>;
  get<T = any>(token?: ProviderToken<T>, hook?: InjectionHook, session?: Session): T | Promise<T>;
  get<T = any>(token?: ProviderToken<T>, hooks?: Array<InjectionHook>, session?: Session): T | Promise<T>;
  get<T = any>(token?: ProviderToken<T>, annotations?: InjectionAnnotations, session?: Session): T | Promise<T>;
  get<T = any>(hook?: InjectionHook, annotations?: InjectionAnnotations): T | Promise<T>;
  get<T = any>(hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations, session?: Session): T | Promise<T>;
  get<T = any>(token?: ProviderToken<T>, hook?: InjectionHook, annotations?: InjectionAnnotations, session?: Session): T | Promise<T>;
  get<T = any>(token?: ProviderToken<T>, hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations, session?: Session): T | Promise<T>;
  get<T = any>(token?: ProviderToken<T> | InjectionHook | Array<InjectionHook> | InjectionAnnotations, hooks?: InjectionHook | Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations, session?: Session): T | Promise<T>;
  get<T = any>(token?: ProviderToken<T> | InjectionHook | Array<InjectionHook> | InjectionAnnotations, hooks?: InjectionHook | Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations, session?: Session): T | Promise<T> {
    if (this.status & InjectorStatus.DESTROYED || !(this.status & InjectorStatus.INITIALIZED)) return; 
    ({ token, hooks, annotations } = serializeInjectArguments(token as ProviderToken<T>, hooks as Array<InjectionHook>, annotations));
    const argument = createInjectionArgument(token as ProviderToken<T>, hooks as InjectionHook | Array<InjectionHook>, { target: Injector, kind: InjectionKind.STANDALONE, annotations });
    return inject(this, argument, session);
  }

  import(module: ModuleImportType): Injector | Promise<Injector> {
    if (this.status & InjectorStatus.DESTROYED || this.options.importing !== 'enabled') return; 
    return importModule(this, module);
  }

  provide(...providers: ProviderType[]): void {
    if (this.status & InjectorStatus.DESTROYED) return;
    processProviders(this, providers);
  }
}
