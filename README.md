# ADI.JS

## TODO

- think about adding `when` and `provide` as ProviderToken in InjectableDefinition
- rethink All() hook - for it ADI has "dry-run". Maybe "dry-run" isn't need and we can remove it.
- rethink dry-run functionality - it should be called not in all hooks, revisit them and check if given hook needs dry-run
- make something like `reflection-metadata` library but only for ADI
- connect instance's `links` as session, not instances
- links sessions in inline function resolver to some session (as children) to destroy created (maybe) instances in the resolver function to avoid stack overflow 
- retrieve hooks from InjectionToken and InjectableDefinition and concat it with hooks from provider definition

- how to not destroy instances in standalone resolver function which should be destroyed, e.g. transient instances? Maybe by metadata label `destroy: false`
- handle in proper way all ModuleMetadata input in injector import/export