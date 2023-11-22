import type { ADI } from "../adi";

export interface ADIOptions {
  stackoveflowDeep: number
}

declare global {
  const $$adi: ADI;
}