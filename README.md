# ADIJS

- Allow change wrappers on runtime - in another, previous in wrappers' chain wrapper. Also have definition of next wrappers in single wrapper - it will be awesome feature for collections wrappers like `Multi`
- TODO: Implement `onDestroy` hook on wrappers. What does it mean? Make some event emitter wrappers to "destroy" service using `emitDestroy(serviceRef)` :)
- Add wrappers for components
- Add tree-shakable wrappers, eg for Multi purpose
- Add providers and imports in the providers and components as metadata - create for providers/components separate injector like in Angular for @Component - `providers` will be easier than `imports` to implement, because I don't know how to handle the async dynamic modules, when resolve the modules... - create Proto Injector like in old Angular https://github.com/angular/angular/blob/a92a89b0eb127a59d7e071502b5850e57618ec2d/packages/docs/di/di_advanced.md#protoinjector-and-injector
- Create `Request` scope
- Reuse the wrappers in the Decorate wrappers - in other words, pass the defined wrappers for decorated injection before `Skip(value)` wrapper - fixed by `Delegate` wrapper
- Add fallback to the providers like in https://github.com/angular/angular/issues/13854
- Reuse wrappers in the wrappers chain in the Fallback, Multi and Decorate wrappers - it can be also useful in the other custom wrappers
- Add `PROVIDER` Injection Token which will be used to wrap all defined providers
- Implement https://autofac.readthedocs.io/en/latest/advanced/pooled-instances.html scope - note about custom hooks like `OnGetFromPool`, probably in the Scope ADI should create the new instance of given provider (definition), or maybe not - ADI can always change reference to the definition in the session
- Implement the `onDestroy` hook
- Improve Circular reference case (change in tests the E and D dependency order in the C class) - fix this bug
- Handle useWrappers (on Decorate example) in the definition (currently they are evaluated each time for instance, even for singleton). For appropriate instance it should evaluates only one time. // maybe INITIALIZED status on the instance will be the best?
- Override injectable options in the `useClass` provider case
- Handle onInit in async mode
- Improve Factory and Delegations delegations -> way how DryIOC it resolves is awesome https://github.com/dadhi/DryIoc/blob/master/docs/DryIoc.Docs/SpecifyDependencyAndPrimitiveValues.md#injecting-value-of-primitive-type
- Implement multiple constructors -> https://github.com/dadhi/DryIoc/blob/master/docs/DryIoc.Docs/SelectConstructorOrFactoryMethod.md#multiple-constructors base logic on the static methods - in this way ADI can treat static methods as factories
- Implement Facades injectors as custom Wrapper like in DryIOC - https://github.com/dadhi/DryIoc/blob/master/docs/DryIoc.Docs/KindsOfChildContainer.md#facade
- Maybe annotations like Named, Labelled etc should be treated as hardcoded annotation in the injection argument? Next to type, parameterKey and index in the meta ADI should store also the static annotations?
- Add `deep` config for `Delegate` wrapper
- Add Pipe, Interceptor and Error Handler functionality/decorators
- Add rebind/remove/clear functionality

Links:
- Hot module reloading for modules/providers/components - https://github.com/nestjs/nest/issues/7961, https://github.com/nestjs/nest/issues/442
- Ability to request injection from a specific parent injector - https://github.com/angular/angular/issues/40974 // SkipSelf() wrapper can have option to pass the specific reference to the parent injector
- Add Custom metadata reader - https://github.com/inversify/InversifyJS/blob/master/wiki/middleware.md#custom-metadata-reader
- Host and visibility in the old ANgular2+ Injector - https://github.com/angular/angular/blob/a92a89b0eb127a59d7e071502b5850e57618ec2d/packages/docs/di/di_advanced.md#host--visibility
- Config for binding in Loopback - https://loopback.io/doc/en/lb4/Context.html#configuration-by-convention

## IMPLEMENTED

- Create `Facade` wrapper to support case written in the https://github.com/inversify/InversifyJS/issues/1156 issue and https://github.com/nestjs/nest/issues/7631 issue - implemented by `Facade` wrapper
- Make delegations more generic like in DryIoc -> https://github.com/dadhi/DryIoc/blob/master/docs/DryIoc.Docs/SpecifyDependencyAndPrimitiveValues.md#specification-api - implemented by `Facade` wrapper
- Make transitional dependency as in https://github.com/typestack/typedi/issues/186 - it should be handled with `Facade` wrapper - implemented by `Facade` wrapper
- TODO: Improve inheritance of wrappers in extending case - it should be new wrappers, not these same as in parent class - it's not needed at the moment, but maybe...
- Put wrappers as a separate collection in injector - `wrappers` - at the moment not needed, but maybe...
- Add `useCustom` provider... - it's not needed - we can create the custom Wrapper like `UseProvider()` with provider shape
