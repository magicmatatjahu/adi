export const INIT_ORDER: string[] = [];

export async function asyncIncrement(name: string) {
  INIT_ORDER.push(name);
}

export async function increment(name: string) {
  INIT_ORDER.push(name);
}
