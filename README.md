# ADIJS

- Put wrappers as a separate collection in injector - `wrappers`
- Allow change wrappers on runtime - in another, previous in wrappers' chain wrapper. Also have definition of next wrappers in single wrapper - it will be awesome feature for collections wrappers like `Multi`
- TODO: Improve inheritance of wrappers in extending case - it should be new wrappers, not these same as in parent class
- TODO: Implement `onDestroy` hook on wrappers. What does it mean? Make some event emitter wrappers to "destroy" service using `emitDestroy(serviceRef)` :)
- Add wrappers for components
- Add tree-shakable wrappers, eg for Multi purpose
- Add providers and imports in the providers and components as metadata - create for providers/components separate injector like in Angular for @Component - `providers` will be easier than `imports` to implement, because I don't know how to handle the async dynamic modules, when resolve the modules...
- Add `useCustom` provider...
- Create `Request` scope
- Reuse the wrappers in the Decorate wrappers - in other words, pass the defined wrappers for decorated injection before `Skip(value)` wrapper - fixed by `Delegate` wrapper
- Add fallback to the providers like in https://github.com/angular/angular/issues/13854
- Make transitional dependency as in https://github.com/typestack/typedi/issues/186 - it should be handled with `Facade` wrapper
- Reuse wrappers in the wrappers chain in the Fallback, Multi and Decorate wrappers - it can be also useful in the other custom wrappers
- Add `PROVIDER` Injection Token which will be used to wrap all defined providers
- Implement https://autofac.readthedocs.io/en/latest/advanced/pooled-instances.html scope - note about custom hooks like `OnGetFromPool`, probably in the Scope ADI should create the new instance of given provider (definition), or maybe not - ADI can always change reference to the definition in the session
- Implement the `onDestroy` hook
- Create `Facade` wrapper to support case written in the https://github.com/inversify/InversifyJS/issues/1156 issue
- Improve Circular reference case (change in tests the E and D dependency order in the C class) - fix this bug
- Handle useWrappers (on Decorate example) in the definition (currently they are evaluated each time for instance, even for singleton). For appropriate instance it should evaluates only one time.
- Override injectable options in the `useClass` provider case
- Handle onInit in async mode