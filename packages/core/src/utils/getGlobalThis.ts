export function getGlobalThis() {
  // @ts-ignore
  if (typeof window !== 'undefined') { return window; } // browser
  if (typeof global !== 'undefined') { return global; } // node
  // @ts-ignore
  if (typeof self !== 'undefined') { return self; } // worker
  throw new Error('unable to locate global object');
};
