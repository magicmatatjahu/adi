# ADIJS

- Add wrappers for components
- Add providers and imports in the providers and components as metadata - create for providers/components separate injector like in Angular for @Component - `providers` will be easier than `imports` to implement, because I don't know how to handle the async dynamic modules, when resolve the modules... - create Proto Injector like in old Angular https://github.com/angular/angular/blob/a92a89b0eb127a59d7e071502b5850e57618ec2d/packages/docs/di/di_advanced.md#protoinjector-and-injector and also how to dispose given modules
- Create `Request` scope
- Reuse wrappers in the wrappers chain in the Fallback, Multi and Decorate wrappers - it can be also useful in the other custom wrappers
- Implement the `onDestroy` hook
- Improve Circular reference case (change in tests the E and D dependency order in the C class) - fix this bug
- Handle onInit in async mode
- Improve Factory and Delegations delegations -> way how DryIOC it resolves is awesome https://github.com/dadhi/DryIoc/blob/master/docs/DryIoc.Docs/SpecifyDependencyAndPrimitiveValues.md#injecting-value-of-primitive-type
- Maybe annotations like Named, Labelled etc should be treated as hardcoded annotation in the injection argument? Next to type, parameterKey and index in the meta ADI should store also the static annotations?
- Rethink the `Multi` wrapper
- Rethinkg the modules and exporting of the provider
- Rethink components - inherite logic from providers
- Handle wrappers on circular injections

Links:
- Hot module reloading for modules/providers/components - https://github.com/nestjs/nest/issues/7961, https://github.com/nestjs/nest/issues/442
- Host and visibility in the old Angular2+ Injector - https://github.com/angular/angular/blob/a92a89b0eb127a59d7e071502b5850e57618ec2d/packages/docs/di/di_advanced.md#host--visibility
- Config for binding in Loopback - https://loopback.io/doc/en/lb4/Context.html#configuration-by-convention

React:
- Implement ProtoInjector and think how to reuse the created modules from the scope, it means how to reuse the modules that will be create in the hierarchy one time and then reuse - the main problem is with imported modules and with `exports` - probably in react (and in other front-end tools) exports isn't good solution

## IMPLEMENTED

- Create `Facade` wrapper to support case written in the https://github.com/inversify/InversifyJS/issues/1156 issue and https://github.com/nestjs/nest/issues/7631 issue - implemented by `Facade` wrapper
- Make delegations more generic like in DryIoc -> https://github.com/dadhi/DryIoc/blob/master/docs/DryIoc.Docs/SpecifyDependencyAndPrimitiveValues.md#specification-api - implemented by `Facade` wrapper
- Make transitional dependency as in https://github.com/typestack/typedi/issues/186 - it should be handled with `Facade` wrapper - implemented by `Facade` wrapper
- TODO: Improve inheritance of wrappers in extending case - it should be new wrappers, not these same as in parent class - it's not needed at the moment, but maybe...
- Put wrappers as a separate collection in injector - `wrappers` - at the moment not needed, but maybe...
- Add `useCustom` provider... - it's not needed - we can create the custom Wrapper like `UseProvider()` with provider shape
- Ability to request injection from a specific parent injector - https://github.com/angular/angular/issues/40974 // SkipSelf() wrapper can have option to pass the specific reference to the parent injector - implemented by SkipSelf wrapper
- Reuse the wrappers in the Decorate wrappers - in other words, pass the defined wrappers for decorated injection before `Skip(value)` wrapper - fixed by `Delegate` wrapper
- Add Custom metadata reader - https://github.com/inversify/InversifyJS/blob/master/wiki/middleware.md#custom-metadata-reader - implemented by `provider` static property
- Override injectable options in the `useClass` provider case - scope is overrided if can be and annotations are merged
- Handle useWrappers (on Decorate example) in the definition (currently they are evaluated each time for instance, even for singleton). For appropriate instance it should evaluates only one time - handled by DECORATOR_ID value.

## NICE TO HAVE BUT NOT NEEDED

- Add tree-shakable wrappers, eg for Multi purpose
- Allow change wrappers on runtime - in another, previous in wrappers' chain wrapper. Also have definition of next wrappers in single wrapper - it will be awesome feature for collections wrappers like `Multi`
- Add `deep` config for `Delegate` wrapper
- Add Pipe, Interceptor and ErrorHandler functionality/decorators
- Add rebind/remove/clear functionality
- Implement multiple constructors -> https://github.com/dadhi/DryIoc/blob/master/docs/DryIoc.Docs/SelectConstructorOrFactoryMethod.md#multiple-constructors base logic on the static methods - in this way ADI can treat static methods as factories
- Implement Facades injectors as custom Wrapper like in DryIOC - https://github.com/dadhi/DryIoc/blob/master/docs/DryIoc.Docs/KindsOfChildContainer.md#facade
- Add `PROVIDER` Injection Token which will be used to wrap all defined providers in module
- Implement https://autofac.readthedocs.io/en/latest/advanced/pooled-instances.html scope - note about custom hooks like `OnGetFromPool`, probably in the Scope ADI should create the new instance of given provider (definition), or maybe not - ADI can always change reference to the definition in the session
- Add fallback to the providers like in https://github.com/angular/angular/issues/13854
- Implement something like ContextView from Loopback https://loopback.io/doc/en/lb4/Context.html#context-view
