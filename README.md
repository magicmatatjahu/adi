# ADI.JS

## TODO

- [ ] make babel and typescript plugin/transformer for aot transformation injectable classes for itself `_$prov` definition.
- [ ] improve typos for providers -> make more generic in multi case.
- [ ] add concurrency mode in resolving providers - for performance. Possible problems:
  - current injector in resolver
  - ContextToken creation
  - override ref to resolved value
- [ ] add scopes:
  - [x] Default
  - [x] Singleton
  - [x] Transient
  - [ ] Request
  - [ ] Custom - partially
- [ ] Make possibility to decorate injected values using function in @Decorate() decorator
- [ ] Make possibility to decorate injected values in method injection -> probably @Pipe() will be best option :)
- [ ] Lookup transient providers in method injection for `onDestroy` hook
- [ ] REIMPLEMENT @Decorate() decorator
- [X] Handle native private fields - it should be done by using ServiceLocator 
- [ ] @Decorate(), @Pipe(), @Intercept() should be implemented as extensions
- [ ] Maybe change @Scoped() decorator signature to have possibility to pass an array of scopes?
- [ ] think about onActivation handler like in InversifyJS, but maybe it could be done by CustomScope
- [ ] Make context more flexible - add possibility to read and write context in Custom Scope - partially done
- [X] in INLINE module case first load old records and then write it to parentInjector - in this same way like in Angular
- [X] test case when user uses `@SkipSelf()` decorator and parent module has the wanted provider, but from child module (because child module exports provider to parent) -> it works but shouldn't. This same case `@Self()` -> fix also deep exporting
- [X] fix deep exporting: test case when user use `@SkipSelf()` decorator and in parent module has the wanted provider, but from child module (because child module export provider to parent) -> it will work but shouldn't. This same case `@Self()`
- [X] throw error when use `@New()` decorator for `useValue` and `useExisting` provider -> for useValue ADI throws, but for useExisting this is unnecessary
- [ ] fix exporting of module (in case when module is not imported but only want to be exported).
- [X] concatenate provider flags to one field
- [ ] Check circular references in modules imports
- [X] add synchronous resolution for browser
- [ ] Fix onDestroy hook
- [X] Add tests for useClassFactory in common package.
- [ ] Fix INQUIRER provider in method injection - make proxy to determine who calls given method - or maybe not? :)
- [ ] Maybe useExisting group is a bad idea?
- [ ] user should be able to create providers in module initialization, something like:

```ts
@Module()
class SomeModule {
  constructor(
    public service: SomeService,
  ) {}

  onInit(injector: Injector) {
    // asSelf can be omit -> default behaviour
    injector.useClass(SomeService).asSelf().inject([ ...providers ]).withScope(Scope.Transient)
    injector.useValue("someValue").as("someToken").withContext(someCtx);
    injector.useValue("someValue").as("someAnotherToken").export();
  }
}
```

- [ ] support fluent api like above
- [ ] support resolution hooks like `onPending`, `onActivation` like in autoFac. `onPending` should be static. User should be able to create this function in provider definition.
- [ ] call provider def for static methods - create something like `@Bean` annotation in Spring
- [ ] handle in proper way Inquirer provider in normal injection and in method
