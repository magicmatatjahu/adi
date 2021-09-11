  // // getComponent<T>(token: Type<T>, options?: InjectionOptions, meta?: InjectionMetadata, session?: Session): Promise<T | undefined> | T | undefined {
  // //   const component = this.components.get(token);
  // //   if (component === undefined) {
  // //     throw Error(`Given component of ${token} type doesn't exists`);
  // //   }

  // //   options = InjectorMetadata.createOptions(token);
  // //   const newSession = new Session(undefined, undefined, undefined, options, meta, session);

  // //   // const wrapper = options && options.wrapper;
  // //   // if (wrapper) {
  // //   //   const last = (i: Injector, s: Session) => i.resolveComponent(component, s.options, s);
  // //   //   return runWrappers(wrapper, this, session, last);
  // //   // }

  // //   return this.resolveComponent(component, options, newSession);
  // // }

  // // private resolveComponent<T>(comp: ComponentRecord<T>, options?: any, session?: Session): Promise<T | undefined> | T | undefined {
  // //   let scope = comp.scope;
  // //   if (scope.canBeOverrided() === true) {
  // //     scope = options.scope || scope;
  // //   }
  // //   const instance = InjectorMetadata.getComponentInstanceRecord(comp, scope, session);
  // //   return instance.value || (instance.value = comp.factory(this, session) as any);
  // // }

  // addComponent(component: Type): void {
  //   // const record = InjectorMetadata.toComponentRecord(component, this);
  //   // this.components.set(component, record);

  //   component && InjectorMetadata.toRecord(component, this, true);
  // }

  // toComponentRecord<T>(
  //   comp: Type<T>,
  //   host: Injector,
  //   useWrapper?: Wrapper,
  // ): ComponentRecord<T> {
  //   const def = this.getProviderDef(comp);
  //   return {
  //     comp,
  //     host,
  //     factory: def.factory,
  //     scope: (def.options.scope || Scope.SINGLETON) as any,
  //     useWrapper,
  //     values: new Map<Context, ComponentInstanceRecord>(),
  //   };
  // }

  // createComponentInstanceRecord<T>(
  //   ctx: Context,
  //   value: T | undefined,
  //   comp: ComponentRecord<T>,
  // ): ComponentInstanceRecord<T> {
  //   return {
  //     ctx,
  //     value,
  //     comp,
  //     // children: new Set(),
  //     // parents: new Set(),
  //   };
  // }

  // getComponentInstanceRecord<T>(
  //   comp: ComponentRecord<T>, 
  //   scope: Scope,
  //   session?: Session,
  // ): ComponentInstanceRecord<T> {
  //   // FIX this
  //   // const ctx = scope.getContext(session, comp as any) || STATIC_CONTEXT;
  //   const ctx = STATIC_CONTEXT;
  //   let instance = comp.values.get(ctx);
  //   if (instance === undefined) {
  //     instance = this.createComponentInstanceRecord(ctx, undefined, comp);
  //     comp.values.set(ctx, instance);
  //   }

  //   // TODO: FIX TYPES!!!
  //   (session.instance as any) = instance;
  //   return instance;
  // }

  // getComponentRecord<T>(
  //   token: Token<T>,
  //   host: Injector,
  // ): ProviderRecord {
  //   const records: Map<Token, ProviderRecord> = (host as any)._components;
  //   let record = records.get(token);
  //   if (record === undefined) {
  //     record = new ProviderRecord(token, host);
  //     records.set(token, record);
  //   }
  //   return record;
  // }