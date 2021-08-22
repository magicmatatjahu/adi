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
- Make transitional dependency as in https://github.com/typestack/typedi/issues/186
- Reuse wrappers in the wrappers chain in the Fallback, Multi and Decorate wrappers - it can be also useful in the other custom wrappers
- Add `PROVIDER` Injection Token which will be used to wrap all defined providers
- Check if `instance` property in the session should be copied or not - check in all wrappers
- Implement https://autofac.readthedocs.io/en/latest/advanced/pooled-instances.html scope - note about custom hooks like `OnGetFromPool`, probably in the Scope ADI should create the new instance of given provider (definition), or maybe not - ADI can always change reference to the definition in the session
- Implement the `onDestroy` hook
- Create `Facade` wrapper to support case written in the https://github.com/inversify/InversifyJS/issues/1156 issue
