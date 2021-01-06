import { InjectionToken, Scope } from "@adi/core";

export const ENVIRONMENT_NODE_ID = 'node';
export const ENVIRONMENT_BROWSER_ID = 'browser';
export const ENVIRONMENT_DENO_ID = 'deno';
export const ENVIRONMENT_WEBWORKER_ID = 'webworker';

export function isEnvironmentNode(envId: string): boolean {
  return envId === ENVIRONMENT_NODE_ID;
}

export function isEnvironmentBrowser(envId: string): boolean {
  return envId === ENVIRONMENT_BROWSER_ID;
}

export function isEnvironmentDeno(envId: string): boolean {
  return envId === ENVIRONMENT_DENO_ID;
}

export function isEnvironmentWebworker(envId: string): boolean {
  return envId === ENVIRONMENT_WEBWORKER_ID;
}

function retrieveEnvironmentID(): string {
  if (typeof process !== 'undefined' && process.versions != null && process.versions.node != null) {
    return ENVIRONMENT_NODE_ID;
  }
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    return ENVIRONMENT_BROWSER_ID;
  }
  if (typeof Deno !== 'undefined') {
    return ENVIRONMENT_DENO_ID;
  }
  if (typeof self === 'object' && self.constructor && self.constructor.name === 'DedicatedWorkerGlobalScope') {
    return ENVIRONMENT_WEBWORKER_ID;
  }
  throw new Error("Unsupported environment.");
}

export const ENVIRONMENT_ID = new InjectionToken<string>({
  providedIn: "core",
  scope: Scope.SINGLETON,
  useFactory: retrieveEnvironmentID,
});

declare var window;
declare var Deno;
declare var self;
