export function getGlobalThis() {
  // @ts-ignore
  if (typeof window !== 'undefined') { return window; } // browser/deno
  if (typeof global !== 'undefined') { return global; } // node/bun
  // @ts-ignore
  if (typeof self !== 'undefined') { return self; } // worker
  if (typeof globalThis !== 'undefined') { return globalThis; } // fallback for other runtimes
  throw new Error('unable to locate global object');
};
