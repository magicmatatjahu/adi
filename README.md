# ADIJS

- Put wrappers as a separate collection in injector - `wrappers`
- Allow change wrappers on runtime - in another, previous in wrappers' chain wrapper. Also have definition of next wrappers in single wrapper - it will be awesome feature for collections wrappers like `Multi`
- TODO: Improve inheritance of wrappers in extending case - it should be new wrappers, not these same as in parent class - it's not needed at the moment, but maybe...
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
- Improve Circular reference case (change in tests the E and D dependency order in the C class) - fix this bug
- Handle useWrappers (on Decorate example) in the definition (currently they are evaluated each time for instance, even for singleton). For appropriate instance it should evaluates only one time.
- Override injectable options in the `useClass` provider case
- Handle onInit in async mode
- Improve Factory and Delegations delegations -> way how DryIOC it resolves is awesome https://github.com/dadhi/DryIoc/blob/master/docs/DryIoc.Docs/SpecifyDependencyAndPrimitiveValues.md#injecting-value-of-primitive-type
- Implement multiple constructors -> https://github.com/dadhi/DryIoc/blob/master/docs/DryIoc.Docs/SelectConstructorOrFactoryMethod.md#multiple-constructors base logic on the static methods - in this way ADI can treat static methods as factories
- Implement Facades injectors as custom Wrapper like in DryIOC - https://github.com/dadhi/DryIoc/blob/master/docs/DryIoc.Docs/KindsOfChildContainer.md#facade
- Maybe annotations like Named, Labelled etc should be treated as hardcoded annotation in the injection argument? Next to type, parameterKey and index in the meta ADI should store also the static annotations?
- Maybe `useExisting` should have possibility to pass as token also the wrappers? By this ADI can enable much more possibilities, something like: // nope, here can be used the `Fallback` wrapper with provider definition

```
{
  provide: ...
  useExisting: Token(..., Named(...))
}
```

- Add `deep` config for `Delegate` wrapper

Links:
- Hot module reloading for modules/providers/components - https://github.com/nestjs/nest/issues/7961, https://github.com/nestjs/nest/issues/442
- Ability to request injection from a specific parent injector - https://github.com/angular/angular/issues/40974 // SkipSelf() wrapper can have option to pass the specific reference to the parent injector

## IMPLEMENTED

- Create `Facade` wrapper to support case written in the https://github.com/inversify/InversifyJS/issues/1156 issue and https://github.com/nestjs/nest/issues/7631 issue - implememted in `Facade` wrapper
- Make delegations more generic like in DryIoc -> https://github.com/dadhi/DryIoc/blob/master/docs/DryIoc.Docs/SpecifyDependencyAndPrimitiveValues.md#specification-api - implemented by `Facade` wrapper