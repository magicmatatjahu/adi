import { runInInjectionContext } from './inject';
import { destroyInjector } from './lifecycle-manager';
import { inject } from './resolver';
import { createInjectionMetadata, processProviders } from './metadata';
import { initModule, importModule, retrieveDeepExtendedModule } from './module';
import { ADI } from '../adi';
import { MODULE_REF, INJECTOR_CONFIG, INITIALIZERS } from '../constants';
import { InjectionKind, InjectorStatus } from '../enums';
import { Optional, All } from '../hooks';
import { isExtendedModule, isModuleToken, PromisesHub, wait } from '../utils';
import { cacheMetaKey, scopedInjectorsMetaKey, scopedInjectorLabelMetaKey } from '../private';

import type { RunInContextArgument } from './inject'
import type { ClassType, ProviderToken, ProviderType, ProviderRecord, InjectionHook, InjectionAnnotations, InjectorInput, InjectorOptions, InjectionHookRecord, ModuleMetadata, InjectionContext, InjectFunctionResult, InferredInjectFunctionResult } from '../types';

export class Injector<T = any> {
  static create<T, P>(
    input?: InjectorInput<T>,
    options?: InjectorOptions,
    parent?: Injector<P> | null,
  ): Injector<T> {
    return new Injector(input, options, parent);
  }

  private injectionCtx: InjectionContext = {
    injector: this, 
    metadata: createInjectionMetadata({ kind: InjectionKind.INJECTOR }), 
    session: undefined,
  }

  public status: InjectorStatus = InjectorStatus.NONE;
  public readonly imports = new Map<InjectorInput<T>, Injector<T>>();
  public readonly providers = new Map<ProviderToken<any>, { self?: ProviderRecord | null, imported?: Array<ProviderRecord> }>();
  public readonly hooks: Array<InjectionHookRecord> = [];
  public readonly meta: Record<string | symbol, any> = {
    [cacheMetaKey]: new Map<any, any>(),
    [scopedInjectorsMetaKey]: undefined,
    [scopedInjectorLabelMetaKey]: undefined,
  };

  constructor(
    public readonly input: InjectorInput<T> = [],
    public readonly options: InjectorOptions = {},
    public readonly parent: Injector<T> | null | undefined = ADI.core,
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
      const deepModule = retrieveDeepExtendedModule(input);
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
      { provide: INITIALIZERS, hooks: [All({ imported: false }), Optional()] },
      ...providers
    );

    if (options.initialize) {
      PromisesHub.create(this)
      wait(initModule(this, this.input as any), () => PromisesHub.resolve(this, this));
    }
  }

  get<T>(token: ProviderToken<T>): InjectFunctionResult<InferredInjectFunctionResult<T>>;
  get<T, A>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>): InjectFunctionResult<A>;
  get<T, A, B>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>): InjectFunctionResult<B>;
  get<T, A, B, C>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectFunctionResult<C>;
  get<T, A, B, C, D>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectFunctionResult<D>;
  get<T, A, B, C, D, E>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectFunctionResult<E>;
  get<T, A, B, C, D, E, F>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectFunctionResult<F>;
  get<T, A, B, C, D, E, F, G>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectFunctionResult<G>;
  get<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectFunctionResult<H>;
  get<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
  get<T>(token: ProviderToken<T>, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
  
  get<T>(token: ProviderToken<T>, annotations: InjectionAnnotations): InjectFunctionResult<InferredInjectFunctionResult<T>>;
  get<T, A>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>): InjectFunctionResult<A>;
  get<T, A, B>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>): InjectFunctionResult<B>;
  get<T, A, B, C>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectFunctionResult<C>;
  get<T, A, B, C, D>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectFunctionResult<D>;
  get<T, A, B, C, D, E>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectFunctionResult<E>;
  get<T, A, B, C, D, E, F>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectFunctionResult<F>;
  get<T, A, B, C, D, E, F, G>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectFunctionResult<G>;
  get<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectFunctionResult<H>;
  get<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
  get<T>(token: ProviderToken<T>, annotations: InjectionAnnotations, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
  
  get<A>(hook1: InjectionHook<unknown, A>): InjectFunctionResult<A>
  get<A, B>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>): InjectFunctionResult<B>;
  get<A, B, C>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): InjectFunctionResult<C>;
  get<A, B, C, D>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): InjectFunctionResult<D>;
  get<A, B, C, D, E>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): InjectFunctionResult<E>;
  get<A, B, C, D, E, F>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): InjectFunctionResult<F>;
  get<A, B, C, D, E, F, G>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): InjectFunctionResult<G>;
  get<A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): InjectFunctionResult<H>;
  get<A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
  get(...hooks: InjectionHook[]): InjectFunctionResult<unknown>;

  get<T>(token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, ...hooks: InjectionHook[]): InjectFunctionResult<T> {
    if (this.status & InjectorStatus.DESTROYED || !(this.status & InjectorStatus.INITIALIZED)) {
      return undefined as T;
    }
    return inject(this.injectionCtx, token as any, annotations as any, ...hooks)
  }

  getSync<T>(token: ProviderToken<T>): InferredInjectFunctionResult<T>;
  getSync<T, A>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>): A;
  getSync<T, A, B>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>): B;
  getSync<T, A, B, C>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): C;
  getSync<T, A, B, C, D>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): D;
  getSync<T, A, B, C, D, E>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): E;
  getSync<T, A, B, C, D, E, F>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): F;
  getSync<T, A, B, C, D, E, F, G>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): G;
  getSync<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): H;
  getSync<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): unknown;
  getSync<T>(token: ProviderToken<T>, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
  
  getSync<T>(token: ProviderToken<T>, annotations: InjectionAnnotations): InferredInjectFunctionResult<T>;
  getSync<T, A>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>): A;
  getSync<T, A, B>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>): B;
  getSync<T, A, B, C>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): C;
  getSync<T, A, B, C, D>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): D;
  getSync<T, A, B, C, D, E>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): E;
  getSync<T, A, B, C, D, E, F>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): F;
  getSync<T, A, B, C, D, E, F, G>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): G;
  getSync<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): H;
  getSync<T, A, B, C, D, E, F, G, H>(token: ProviderToken<T>, annotations: InjectionAnnotations, hook1: InjectionHook<InferredInjectFunctionResult<T>, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): unknown;
  getSync<T>(token: ProviderToken<T>, annotations: InjectionAnnotations, ...hooks: InjectionHook[]): InjectFunctionResult<unknown>;
  
  getSync<A>(hook1: InjectionHook<unknown, A>): A
  getSync<A, B>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>): B;
  getSync<A, B, C>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>): C;
  getSync<A, B, C, D>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>): D;
  getSync<A, B, C, D, E>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>): E;
  getSync<A, B, C, D, E, F>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>): F;
  getSync<A, B, C, D, E, F, G>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>): G;
  getSync<A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>): H;
  getSync<A, B, C, D, E, F, G, H>(hook1: InjectionHook<unknown, A>, hook2: InjectionHook<A, B>, hook3: InjectionHook<B, C>, hook4: InjectionHook<C, D>, hook5: InjectionHook<D, E>, hook6: InjectionHook<E, F>, hook7: InjectionHook<F, G>, hook8: InjectionHook<G, H>, ...hooks: InjectionHook[]): unknown;
  getSync(...hooks: InjectionHook[]): unknown;

  getSync<T>(token: ProviderToken<T> | InjectionAnnotations | InjectionHook, annotations?: InjectionAnnotations | InjectionHook, ...hooks: InjectionHook[]): T {
    return this.get(token as any, annotations as any, ...hooks) as T
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
  of(label: string | symbol): Injector;
  of(input: ModuleMetadata | Array<ProviderType>): Injector;
  of(label: string | symbol, input: ModuleMetadata | Array<ProviderType>): Injector;
  of(inputOrLabel?: string | symbol | ModuleMetadata | Array<ProviderType>, maybeInput?: ModuleMetadata | Array<ProviderType>): Injector {
    if (this.status & InjectorStatus.DESTROYED || !(this.status & InjectorStatus.INITIALIZED)) {
      return undefined as unknown as Injector;
    }

    let label: string | symbol | undefined;
    let input: ModuleMetadata | Array<ProviderType> | undefined;
    if (inputOrLabel !== undefined) {
      const typeOf = typeof inputOrLabel;
      if (typeOf === 'string' || typeOf === 'symbol') {
        label = inputOrLabel as string | symbol;
        input = maybeInput
      } else {
        input = inputOrLabel as ModuleMetadata | Array<ProviderType>;
      }
    }

    const scopedInjector = Injector.create(input || [], { exporting: false }, this);
    if (label !== undefined) {
      scopedInjector[scopedInjectorLabelMetaKey] = label
      let injectors: Map<string | symbol, Injector> = this.meta[scopedInjectorsMetaKey];
      if (!injectors) {
        injectors = (this.meta[scopedInjectorsMetaKey] = new Map<string | symbol, Injector>());
      }
      injectors.set(label, scopedInjector);
    }
    
    return scopedInjector;
  }

  import<T>(input: InjectorInput<T> | Promise<InjectorInput<T>>): Injector<T> | Promise<Injector<T>> {
    if (this.status & InjectorStatus.DESTROYED || !this.options.importing) {
      return undefined as unknown as Injector<T> | Promise<Injector<T>>;
    }
    return importModule(this, input);
  }

  init(): Injector<T> | Promise<Injector<T>> {
    if (!PromisesHub.get(this)) {
      return this;
    }
    return PromisesHub.create(this);
  }

  destroy(): Promise<void>;
  destroy(label: string | symbol): Promise<void>;
  destroy(label?: string | symbol): Promise<void> {
    if (label === undefined) {
      return destroyInjector(this)
    }

    const scopedInjector: Injector | undefined = this.meta[scopedInjectorsMetaKey]?.get(label);
    if (scopedInjector) {
      return scopedInjector.destroy()
    }

    // TODO: Uncomment this and fix TS error: 
    // `function lacks ending return statement and return type does not include 'undefined'`
    return undefined as any;
  }
}
