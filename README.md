# ADIJS

- Put wrappers as a separate collection in injector - `wrappers`
- Allow change wrappers on runtime - in another, previous in wrappers' chain wrapper. Also have definition of next wrappers in sigle wrapper - it will be awesome feature for collections wrappers like `Multi`
- TODO: Improve inheritance of wrappers in extending case - it should be new wrappers, not these same as in parent class
- TODO: Implement `onDestroy` hook on wrappers. What does it mean? Make some event emitter wrappers to "destroy" service using `emitDestroy(serviceRef)` :)
