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