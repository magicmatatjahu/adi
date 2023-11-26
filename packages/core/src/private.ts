export const ADI_INJECTABLE_DEF = Symbol.for('adi:definition:injectable');
export const ADI_MODULE_DEF = Symbol.for('adi:definition:module');
export const ADI_HOOK_DEF = Symbol.for('adi:definition:hook');
export const ADI_SCOPE_DEF = Symbol.for('adi:definition:scope');
export const ADI_INJECTION_ARGUMENT = Symbol.for('adi:definition:injection-argument');

export const cacheMetaKey = Symbol.for('adi:cache');
export const scopedInjectorsMetaKey = Symbol.for('adi:scoped-injectors');
export const scopedInjectorLabelMetaKey = Symbol.for('adi:scoped-injector-label');
export const cacheArgumentMetaKey = Symbol.for('adi:cache-argument');
export const initHooksMetaKey = Symbol.for('adi:lifecycle:on-init');
export const destroyHooksMetaKey = Symbol.for('adi:lifecycle:on-destroy');
export const disposePatchedMetaKey = Symbol.for('adi:dispose-patched');
export const circularSessionsMetaKey = Symbol.for('adi:circular-sessions');
export const parallelMetaKey = Symbol.for('adi:parallel');
export const treeInjectorMetaKey = Symbol.for('adi:tree-injector');
export const exportedToInjectorsMetaKey = Symbol.for('adi:exported-to-injectors');
export const definitionInjectionMetadataMetaKey = Symbol.for('adi:definition-injection-metadata');
export const instancesToDestroyMetaKey = Symbol.for('adi:instances-to-destroy');
export const originalMethodMetaKey = Symbol.for('adi:original-method');
export const methodPatchedMetaKey = Symbol.for('adi:method-patched');
export const dynamicContextMetaKey = Symbol.for('adi:dynamic-context');
export const dynamicInstancesMetaKey = Symbol.for('adi:dynamic-instances');

export const OBJECT_REF = {};
export const ARRAY_REF = {};

(Symbol as any).dispose ??= Symbol("Symbol.dispose");
(Symbol as any).asyncDispose ??= Symbol("Symbol.asyncDispose");
