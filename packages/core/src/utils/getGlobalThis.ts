export function getGlobalThis() {
  // @ts-ignore
  if (typeof self !== 'undefined') { return self; }
    // @ts-ignore
  if (typeof window !== 'undefined') { return window; }
  if (typeof global !== 'undefined') { return global; }
  throw new Error('unable to locate global object');
};
