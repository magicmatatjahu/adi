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