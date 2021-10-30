# ADIJS

- Handle onInit in async mode
- Maybe annotations like Named, Labelled etc should be treated as hardcoded annotation in the injection argument? Next to type, parameterKey and index in the meta ADI should store also the static annotations?
- Think about creating modules from exports which is not imported, so they are not created before exporting - problem is with proxy modules, in other words how to check on graph resolution that given export must be created as new injector, not export providers from it - maybe by new field `create` or by changing shape of exported module in `exports` array?
- Add initialization of all injectors (even new Injector([])) to the `.build` method.
- Maybe passing factory to scope and create instance in scope (like in Java) is better option than context? - rething if Context is needed.
- Think how to ensure the session for onDestroy hooks to pass it in the `onDestroy` factory
- Add possibility to define providers and imports in every standalone wrapper where user can define inject 

## IMPLEMENTED

- Create `Portal` wrapper to support case written in the https://github.com/inversify/InversifyJS/issues/1156 issue and https://github.com/nestjs/nest/issues/7631 issue - implemented by `Portal` wrapper
- Make delegations more generic like in DryIoc -> https://github.com/dadhi/DryIoc/blob/master/docs/DryIoc.Docs/SpecifyDependencyAndPrimitiveValues.md#specification-api - implemented by `Portal` wrapper
- Make transitional dependency as in https://github.com/typestack/typedi/issues/186 - it should be handled with `Portal` wrapper - implemented by `Portal` wrapper
- TODO: Improve inheritance of wrappers in extending case - it should be new wrappers, not these same as in parent class - it's not needed at the moment, but maybe...
- Put wrappers as a separate collection in injector - `wrappers` - at the moment not needed, but maybe...
- Add `useCustom` provider... - it's not needed - we can create the custom Wrapper like `UseProvider()` with provider shape
- Ability to request injection from a specific parent injector - https://github.com/angular/angular/issues/40974 // SkipSelf() wrapper can have option to pass the specific reference to the parent injector - implemented by SkipSelf wrapper
- Reuse the wrappers in the Decorate wrappers - in other words, pass the defined wrappers for decorated injection before `Skip(value)` wrapper - fixed by `Delegate` wrapper
- Add Custom metadata reader - https://github.com/inversify/InversifyJS/blob/master/wiki/middleware.md#custom-metadata-reader - implemented by `provider` static property
- Override injectable options in the `useClass` provider case - scope is overrided if can be and annotations are merged
- Handle useWrappers (on Decorate example) in the definition (currently they are evaluated each time for instance, even for singleton). For appropriate instance it should evaluates only one time - handled by DECORATOR_ID value.
- Add wrappers for components // ADI treats components as provdiers to it works
- Change the logic of the Value wrapper to similar as Skip 
- Introduce wrappers for modules
- Check deep extends
- Handle wrappers on circular injections - especially `Decorate` and `OnInitHook` - it can be handled by Lazy wrapper - check the test for Lazy wrapper
- Check how to call onDestroy on circular injections (in which order)
- Create placeholder parent session in `injector.get` function

## IMPLEMENTED PARTIALLY BUT IT WORKS

- Implement the `onDestroy` hook
- Implement ProtoInjector and think how to reuse the created modules from the scope, it means how to reuse the modules that will be create in the hierarchy one time and then reuse - the main problem is with imported modules and with `exports` - probably in react (and in other front-end tools) exports isn't good solution
- Think about order of initializing and destroying modules - at the moment initializing is from end and destroying from beginning stack // it's good order like in C++ destructors
- Reuse wrappers in the wrappers chain in the Fallback, Multi and Decorate wrappers - it can be also useful in the other custom wrappers - done by `DRY_RUN` session's status
- Implement Portals injectors as custom Wrapper like in DryIOC - https://github.com/dadhi/DryIoc/blob/master/docs/DryIoc.Docs/KindsOfChildContainer.md#facade

## RETHING - WORKS BUT IT SHOULD BE BETTER

- Rethink the `Multi` wrapper
- Rethink the modules and exporting of the provider
- Rethink proxy modules
- Rething caching in `Cache` wrapping
- Rething about instance record saved in the session - it can increase memory consumption and make stackoverflow in the future if someone will inject Session in the provider - then whole chain of session will be injected and "cached" to the provider
- Rethink session - for example: in method injection it stores information about previous sessions - this can be misleading for singleton because for it previous sessions point to the element that created it first
- Improve Circular reference case (change in tests the E and D dependency order in the C class) - fix this bug
- Improve Factory and Delegations delegations -> way how DryIOC it resolves is awesome https://github.com/dadhi/DryIoc/blob/master/docs/DryIoc.Docs/SpecifyDependencyAndPrimitiveValues.md#injecting-value-of-primitive-type
- Rething SkipSelf wrapper
- Destroy instances with Factory wrapper and other, similar wrappers - on every call factory can create new instance and ADI should destroy it in some way - hard to implement, but here can be used Destroyable wrapper
- Host and visibility in the old Angular2+ Injector - https://github.com/angular/angular/blob/a92a89b0eb127a59d7e071502b5850e57618ec2d/packages/docs/di/di_advanced.md#host--visibility // implemented by `.visibility` constraint  
- Add providers and imports in the providers and components as metadata - create for providers/components separate injector like in Angular for @Component - `providers` will be easier than `imports` to implement, because I don't know how to handle the async dynamic modules, when resolve the modules... - create Proto Injector like in old Angular https://github.com/angular/angular/blob/a92a89b0eb127a59d7e071502b5850e57618ec2d/packages/docs/di/di_advanced.md#protoinjector-and-injector and also how to dispose given modules // problem is only with async imports in sync resolution. Also it should be improved by ProtoInjector to not create graph each time when instance is created
- Rethink components - inherite logic from providers - in another solution ADI can treat component as constraint definition of provider // components are treated as providers bur are saved inside components collection
- Rethink imported records - they can be handled in this way that they will merged with providers in parents by references to the definitions - it's not a good idea - how then handle new definitions in children injectors? - treat imported records as collection of imported records

## NICE TO HAVE BUT NOT NEEDED

- Create `Request` scope
- Add tree-shakable wrappers, eg for Multi purpose
- Allow change wrappers on runtime - in another, previous in wrappers' chain wrapper. Also have definition of next wrappers in single wrapper - it will be awesome feature for collections wrappers like `Multi`
- Add `deep` config for `Delegate` wrapper
- Add Pipe, Interceptor and ErrorHandler functionality/decorators
- Add rebind/remove/clear functionality
- Implement multiple constructors -> https://github.com/dadhi/DryIoc/blob/master/docs/DryIoc.Docs/SelectConstructorOrFactoryMethod.md#multiple-constructors base logic on the static methods - in this way ADI can treat static methods as factories
- Add `PROVIDER` Injection Token which will be used to wrap all defined providers in module
- Implement https://autofac.readthedocs.io/en/latest/advanced/pooled-instances.html scope - note about custom hooks like `OnGetFromPool`, probably in the Scope ADI should create the new instance of given provider (definition), or maybe not - ADI can always change reference to the definition in the session
- Add fallback to the providers like in https://github.com/angular/angular/issues/13854
- Implement something like ContextView from Loopback https://loopback.io/doc/en/lb4/Context.html#context-view
- Implement something like `.of` or `createPortal` like in TypeDI - https://docs.typestack.community/typedi/#using-multiple-containers-and-scoped-containers - here `PROVIDER` Injection Token should help - by this we can dynamically change every injection
- Hot module reloading for modules/providers/components - https://github.com/nestjs/nest/issues/7961, https://github.com/nestjs/nest/issues/442
- Config for binding in Loopback - https://loopback.io/doc/en/lb4/Context.html#configuration-by-convention
- Add qualifier field to the provider shape:

  ```ts
  {
    provide: Component,
    qualifier: 'some qualifier'
  }
  ```

- Add plugins to ADI like in Vue :)

  ```ts
  ADI.use({plugin}, {options})
  ```

React:
- Fix problem with ProtoInjector - when ProtInjector is created, before it should point to the parent from context - it must point to the parent before creating, so it jmust be inside React context when ProtoInjector is creating