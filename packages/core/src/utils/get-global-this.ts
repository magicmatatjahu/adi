let __global: any;
export function getGlobalThis() {
  if (__global) return __global;
  // @ts-ignore
  if (typeof window !== 'undefined') { return __global = window; } // browser/deno
  if (typeof global !== 'undefined') { return __global = global; } // node/bun
  // @ts-ignore
  if (typeof self !== 'undefined') { return __global = self; } // worker
  if (typeof globalThis !== 'undefined') { return __global = globalThis; } // fallback for other runtimes
  throw new Error('unable to locate global object');
};
